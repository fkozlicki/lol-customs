-- Live auction rework:
--   * remove the roster reserve (all-in bidding allowed),
--   * passive $1 rule against a zero-budget opponent,
--   * revocable opening pass + 2/2 pass skip (player returns to the draw),
--   * auto-assign remaining players for $0,
--   * draw positions can exceed 8 (skipped players go back into the queue).

alter table public.auction_rooms
  add column opening_passed_a boolean not null default false,
  add column opening_passed_b boolean not null default false;

-- Skipped players are pushed to the back of the draw (positions > 8).
alter table public.auction_players
  drop constraint if exists auction_players_draw_position_check;
alter table public.auction_players
  add constraint auction_players_draw_position_check check (draw_position > 0);

alter table public.auction_events
  drop constraint if exists auction_events_event_type_check;
alter table public.auction_events
  add constraint auction_events_event_type_check check (event_type in (
    'created', 'captain_joined', 'captain_left', 'captain_removed', 'lobby_updated',
    'ready_changed', 'countdown_started', 'countdown_cancelled', 'auction_started',
    'player_revealed', 'bid', 'pass', 'pass_skipped', 'sold', 'auto_assigned', 'completed',
    'cancelled', 'expired'
  ));

-- Snapshot now exposes the opening passes for the current player.
create or replace function public._auction_snapshot(p_room_id uuid, p_viewer_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id,
    'status', r.status,
    'phase', r.phase,
    'settings', jsonb_build_object(
      'startingBudget', r.starting_budget,
      'bidSeconds', r.bid_seconds,
      'orderVisible', r.order_visible
    ),
    'currentPlayerId', r.current_player_id,
    'currentBid', r.current_bid,
    'leadingSide', r.leading_side,
    'countdownEndsAt', r.countdown_ends_at,
    'bidDeadline', r.bid_deadline,
    'phaseDeadline', r.phase_deadline,
    'openingPass', jsonb_build_object('a', r.opening_passed_a, 'b', r.opening_passed_b),
    'stateVersion', r.state_version,
    'serverTime', clock_timestamp(),
    'createdAt', r.created_at,
    'updatedAt', r.updated_at,
    'captains', case when r.status in ('cancelled', 'expired') then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'side', c.side,
        'teamName', c.team_name,
        'profileNickname', up.nickname,
        'playerId', c.player_id,
        'riotId', p.game_name || '#' || p.tag_line,
        'ready', c.ready,
        'budgetRemaining', c.budget_remaining,
        'isCurrentUser', c.user_id = p_viewer_id
      ) order by c.side)
      from public.auction_captains c
      join public.auction_players p on p.id = c.player_id
      join public.user_profiles up on up.id = c.user_id
      where c.room_id = r.id
    ), '[]'::jsonb) end,
    'players', case when r.status in ('cancelled', 'expired') then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'riotId', p.game_name || '#' || p.tag_line,
        'gameName', p.game_name,
        'tagLine', p.tag_line,
        'rank', p.rank_snapshot,
        'drawPosition', case when r.order_visible or p.revealed then p.draw_position else null end,
        'revealed', p.revealed,
        'assignedSide', p.assigned_side,
        'purchasePrice', p.purchase_price,
        'isCaptain', p.is_captain
      ) order by p.is_captain desc, p.draw_position nulls last, p.created_at, p.id)
      from public.auction_players p
      where p.room_id = r.id
    ), '[]'::jsonb) end,
    'events', coalesce((
      select jsonb_agg(e.item order by e.id)
      from (
        select ae.id, jsonb_build_object(
          'id', ae.id,
          'type', ae.event_type,
          'actorSide', ae.actor_side,
          'playerId', ae.player_id,
          'amount', ae.amount,
          'payload', ae.payload,
          'createdAt', ae.created_at
        ) as item
        from public.auction_events ae
        where ae.room_id = r.id
        order by ae.id desc
        limit 500
      ) e
    ), '[]'::jsonb),
    'permissions', jsonb_build_object(
      'side', (select c.side from public.auction_captains c where c.room_id = r.id and c.user_id = p_viewer_id),
      'isCreator', r.creator_id = p_viewer_id,
      'canJoin', p_viewer_id is not null and r.status = 'waiting'
        and not exists (select 1 from public.auction_captains c where c.room_id = r.id and c.side = 'B'),
      'canEditLobby', r.creator_id = p_viewer_id and r.status in ('waiting', 'countdown'),
      'canCancel', r.creator_id = p_viewer_id and r.status in ('waiting', 'countdown', 'active')
    )
  )
  from public.auction_rooms r
  where r.id = p_room_id;
$$;

-- Next reveal picks an unrevealed, unassigned player; hidden mode keeps
-- skipped players (with a draw position) at the back of the queue.
create or replace function public._auction_reveal_next_locked(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visible boolean;
  v_player_id uuid;
  v_next_position smallint;
begin
  select order_visible into v_visible from public.auction_rooms where id = p_room_id;
  select coalesce(max(draw_position), 0) + 1 into v_next_position
  from public.auction_players where room_id = p_room_id and not is_captain;

  if v_visible then
    select id into v_player_id
    from public.auction_players
    where room_id = p_room_id and assigned_side is null and not is_captain and revealed = false
    order by draw_position
    limit 1;
  else
    select id into v_player_id
    from public.auction_players
    where room_id = p_room_id and assigned_side is null and not is_captain and revealed = false
    order by (draw_position is not null), random()
    limit 1;
    update public.auction_players set draw_position = v_next_position where id = v_player_id;
  end if;

  if v_player_id is null then
    perform public._auction_set_terminal_locked(p_room_id, 'completed');
    insert into public.auction_events(room_id, event_type) values (p_room_id, 'completed');
    return;
  end if;

  update public.auction_players set revealed = true where id = v_player_id;
  update public.auction_rooms
  set current_player_id = v_player_id,
      current_bid = 0,
      leading_side = null,
      phase = 'awaiting_opening_bid',
      bid_deadline = null,
      phase_deadline = null,
      opening_passed_a = false,
      opening_passed_b = false,
      updated_at = clock_timestamp(),
      last_activity_at = clock_timestamp(),
      state_version = state_version + 1
  where id = p_room_id;
  insert into public.auction_events(room_id, event_type, player_id)
  values (p_room_id, 'player_revealed', v_player_id);
end;
$$;

create or replace function public._auction_start_locked(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visible boolean;
begin
  select order_visible into v_visible from public.auction_rooms where id = p_room_id;
  if v_visible then
    with shuffled as (
      select id, row_number() over (order by random())::smallint as position
      from public.auction_players
      where room_id = p_room_id and not is_captain
    )
    update public.auction_players p set draw_position = s.position
    from shuffled s where p.id = s.id;
  end if;
  update public.auction_rooms
  set status = 'active', phase = 'awaiting_opening_bid', countdown_ends_at = null,
      opening_passed_a = false, opening_passed_b = false,
      updated_at = clock_timestamp(), last_activity_at = clock_timestamp(), state_version = state_version + 1
  where id = p_room_id and status = 'countdown';
  insert into public.auction_events(room_id, event_type) values (p_room_id, 'auction_started');
  perform public._auction_reveal_next_locked(p_room_id);
end;
$$;

-- Send the current player back to the end of the draw.
create function public._auction_skip_locked(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player_id uuid;
  v_next_position smallint;
begin
  select current_player_id into v_player_id from public.auction_rooms where id = p_room_id;
  if v_player_id is null then return; end if;
  select coalesce(max(draw_position), 0) + 1 into v_next_position
  from public.auction_players where room_id = p_room_id and not is_captain;
  update public.auction_players
  set revealed = false, draw_position = v_next_position
  where id = v_player_id;
  insert into public.auction_events(room_id, event_type, player_id)
  values (p_room_id, 'pass_skipped', v_player_id);
  update public.auction_rooms
  set current_player_id = null, current_bid = 0, leading_side = null,
      phase = 'awaiting_opening_bid', bid_deadline = null, phase_deadline = null,
      opening_passed_a = false, opening_passed_b = false,
      updated_at = clock_timestamp(), last_activity_at = clock_timestamp(), state_version = state_version + 1
  where id = p_room_id;
  perform public._auction_reveal_next_locked(p_room_id);
end;
$$;

-- Remaining players are auto-assigned for free once a side completes a roster.
create or replace function public._auction_sell_locked(p_room_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player_id uuid;
  v_winner text;
  v_loser text;
  v_amount integer;
  v_winner_count integer;
  v_player record;
begin
  select current_player_id, leading_side, current_bid
  into v_player_id, v_winner, v_amount
  from public.auction_rooms where id = p_room_id;
  if v_player_id is null or v_winner is null then
    return;
  end if;
  v_loser := case v_winner when 'A' then 'B' else 'A' end;

  update public.auction_players
  set assigned_side = v_winner, purchase_price = v_amount
  where id = v_player_id and assigned_side is null;
  if not found then return; end if;
  update public.auction_captains
  set budget_remaining = budget_remaining - v_amount
  where room_id = p_room_id and side = v_winner;
  insert into public.auction_events(room_id, event_type, actor_side, player_id, amount, payload)
  values (p_room_id, 'sold', v_winner, v_player_id, v_amount, jsonb_build_object('reason', p_reason));

  select count(*) into v_winner_count
  from public.auction_players
  where room_id = p_room_id and assigned_side = v_winner and not is_captain;

  if v_winner_count = 4 then
    for v_player in
      select id from public.auction_players
      where room_id = p_room_id and assigned_side is null and not is_captain
      order by draw_position nulls last, id
      for update
    loop
      update public.auction_players
      set assigned_side = v_loser, purchase_price = 0, revealed = true
      where id = v_player.id;
      insert into public.auction_events(room_id, event_type, actor_side, player_id, amount)
      values (p_room_id, 'auto_assigned', v_loser, v_player.id, 0);
    end loop;
    perform public._auction_set_terminal_locked(p_room_id, 'completed');
    insert into public.auction_events(room_id, event_type) values (p_room_id, 'completed');
  else
    update public.auction_rooms
    set phase = 'sold_pause', phase_deadline = clock_timestamp() + interval '3 seconds',
        bid_deadline = null, updated_at = clock_timestamp(), last_activity_at = clock_timestamp(),
        state_version = state_version + 1
    where id = p_room_id and status = 'active';
  end if;
end;
$$;

-- Bidding: no reserve (all-in allowed), passive $1 cap, opening passes cleared.
create or replace function public.auction_bid(p_room_id uuid, p_request_id uuid, p_amount integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public._auction_actor_id();
  v_room public.auction_rooms%rowtype;
  v_side text;
  v_other_side text;
  v_budget integer;
  v_other_budget integer;
  v_other_max integer;
  v_seen uuid;
begin
  if p_request_id is null then perform public._auction_fail('AUCTION_REQUEST_ID_REQUIRED'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  select * into v_room from public.auction_rooms where id = p_room_id for update;
  if not found then perform public._auction_fail('AUCTION_ROOM_NOT_FOUND'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  if v_room.status <> 'active' or v_room.phase not in ('awaiting_opening_bid', 'bidding') then
    perform public._auction_fail('AUCTION_BIDDING_CLOSED');
  end if;
  if v_room.phase = 'bidding' and clock_timestamp() >= v_room.bid_deadline then
    perform public._auction_fail('AUCTION_DEADLINE_PASSED');
  end if;
  select side, budget_remaining into v_side, v_budget from public.auction_captains
  where room_id = p_room_id and user_id = v_user_id;
  if v_side is null then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;
  if p_amount is null or p_amount < greatest(1, v_room.current_bid + 1) then
    perform public._auction_fail('AUCTION_BID_TOO_LOW');
  end if;
  if p_amount > v_budget then
    perform public._auction_fail('AUCTION_BUDGET_EXCEEDED');
  end if;
  v_other_side := case v_side when 'A' then 'B' else 'A' end;
  select budget_remaining into v_other_budget from public.auction_captains
  where room_id = p_room_id and side = v_other_side;
  if v_other_budget = 0 and p_amount > v_room.current_bid + 1 then
    perform public._auction_fail('AUCTION_OPPONENT_PASSIVE');
  end if;
  update public.auction_rooms
  set phase = 'bidding', current_bid = p_amount, leading_side = v_side,
      bid_deadline = clock_timestamp() + make_interval(secs => bid_seconds),
      opening_passed_a = false, opening_passed_b = false,
      updated_at = clock_timestamp(), last_activity_at = clock_timestamp(), state_version = state_version + 1
  where id = p_room_id;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id, amount)
  values (p_room_id, p_request_id, 'bid', v_user_id, v_side, v_room.current_player_id, p_amount);

  v_other_max := v_other_budget;
  if v_other_max < p_amount + 1 then
    perform public._auction_sell_locked(p_room_id, 'opponent_cannot_raise');
  end if;
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

-- Pass: before the opening bid it registers a revocable pass (2/2 or a money
-- side vs a zero-budget foe skips the player); during bidding the losing
-- captain concedes to the leader.
create or replace function public.auction_pass(p_room_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public._auction_actor_id();
  v_room public.auction_rooms%rowtype;
  v_side text;
  v_seen uuid;
begin
  if p_request_id is null then perform public._auction_fail('AUCTION_REQUEST_ID_REQUIRED'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  select * into v_room from public.auction_rooms where id = p_room_id for update;
  if not found then perform public._auction_fail('AUCTION_ROOM_NOT_FOUND'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  if v_room.status <> 'active' or v_room.phase not in ('awaiting_opening_bid', 'bidding') then
    perform public._auction_fail('AUCTION_PASS_NOT_ALLOWED');
  end if;
  if v_room.phase = 'bidding' and clock_timestamp() >= v_room.bid_deadline then
    perform public._auction_fail('AUCTION_DEADLINE_PASSED');
  end if;
  select side into v_side from public.auction_captains where room_id = p_room_id and user_id = v_user_id;
  if v_side is null then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;

  if v_room.phase = 'bidding' then
    if v_side = v_room.leading_side then perform public._auction_fail('AUCTION_LEADER_CANNOT_PASS'); end if;
    insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id)
    values (p_room_id, p_request_id, 'pass', v_user_id, v_side, v_room.current_player_id);
    update public.auction_rooms set last_activity_at = clock_timestamp(), updated_at = clock_timestamp(), state_version = state_version + 1
    where id = p_room_id;
    perform public._auction_sell_locked(p_room_id, 'pass');
    return public._auction_snapshot(p_room_id, v_user_id);
  end if;

  -- awaiting_opening_bid: register the opening pass (revocable until foe bids / 2/2)
  update public.auction_rooms
  set opening_passed_a = case when v_side = 'A' then true else opening_passed_a end,
      opening_passed_b = case when v_side = 'B' then true else opening_passed_b end,
      last_activity_at = clock_timestamp(), updated_at = clock_timestamp(), state_version = state_version + 1
  where id = p_room_id;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id)
  values (p_room_id, p_request_id, 'pass', v_user_id, v_side, v_room.current_player_id);

  declare
    v_my_budget integer;
    v_other_budget integer;
    v_other_side text := case v_side when 'A' then 'B' else 'A' end;
    v_passed_a boolean;
    v_passed_b boolean;
  begin
    select budget_remaining into v_my_budget
    from public.auction_captains where room_id = p_room_id and side = v_side;
    select budget_remaining into v_other_budget
    from public.auction_captains where room_id = p_room_id and side = v_other_side;
    select opening_passed_a, opening_passed_b into v_passed_a, v_passed_b
    from public.auction_rooms where id = p_room_id;
    if (v_passed_a and v_passed_b)
       or (v_my_budget > 0 and v_other_budget = 0) then
      perform public._auction_skip_locked(p_room_id);
    end if;
  end;
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

revoke execute on function public._auction_skip_locked(uuid) from public, anon, authenticated, service_role;
