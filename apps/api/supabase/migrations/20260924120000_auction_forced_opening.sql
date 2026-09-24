-- Auctions without skipping:
--   * the pool is the eight players being sold; captains are profiles, not pool players,
--   * every round opens with a forced $1 bid, placed for a random captain in round 1 and then
--     alternating by round, so no captain can skip a player (players took offence at being skipped),
--   * bidding itself is unchanged: open, timed, the non-leader raises or concedes,
--   * a pass exists only in a free auction (the other captain has $0) and hands the player to that
--     captain for $0,
--   * when both captains are out of money the rest of the pool is shared alternately for $0.
--
-- Auction rooms are ephemeral, so existing ones are dropped rather than migrated.

delete from public.auction_rooms;

-- ---- schema ----------------------------------------------------------------------------------

alter table public.auction_captains drop column player_id;
alter table public.auction_players drop column is_captain;

create index auction_players_available_idx on public.auction_players(room_id, draw_position, id)
  where assigned_side is null;

alter table public.auction_players
  drop constraint if exists auction_players_draw_position_check;
alter table public.auction_players
  add constraint auction_players_draw_position_check check (draw_position between 1 and 8);

alter table public.auction_rooms
  drop column opening_passed_a,
  drop column opening_passed_b,
  add column first_opener_side text check (first_opener_side is null or first_opener_side in ('A', 'B')),
  add column round_number smallint not null default 0 check (round_number between 0 and 8);

-- The phase check and the "sold_pause has a deadline" check were created unnamed.
do $$
declare
  v_name text;
begin
  for v_name in
    select conname from pg_constraint
    where conrelid = 'public.auction_rooms'::regclass and contype = 'c'
      and (pg_get_constraintdef(oid) like '%awaiting_opening_bid%'
        or pg_get_constraintdef(oid) like '%sold_pause%phase_deadline%')
  loop
    execute format('alter table public.auction_rooms drop constraint %I', v_name);
  end loop;
end;
$$;

alter table public.auction_rooms
  add constraint auction_rooms_phase_check
    check (phase is null or phase in ('free_auction', 'bidding', 'sold_pause')),
  add constraint auction_rooms_phase_deadline_check
    check ((phase in ('free_auction', 'sold_pause')) = (phase_deadline is not null));

drop index public.auction_rooms_phase_deadline_idx;
create index auction_rooms_phase_deadline_idx on public.auction_rooms(phase_deadline)
  where status = 'active' and phase in ('free_auction', 'sold_pause');

alter table public.auction_events
  drop constraint if exists auction_events_event_type_check;
alter table public.auction_events
  add constraint auction_events_event_type_check check (event_type in (
    'created', 'captain_joined', 'captain_left', 'captain_removed', 'lobby_updated',
    'ready_changed', 'countdown_started', 'countdown_cancelled', 'auction_started',
    'player_revealed', 'opening_bid', 'bid', 'concede', 'pass', 'sold', 'auto_assigned',
    'completed', 'cancelled', 'expired'
  ));

drop function public._auction_skip_locked(uuid);
drop function public.auction_create_room(uuid, jsonb, text, text, integer, integer, boolean);
drop function public.auction_join_captain(uuid, uuid, uuid, text);

-- ---- reads -----------------------------------------------------------------------------------

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
    'roundNumber', r.round_number,
    'countdownEndsAt', r.countdown_ends_at,
    'bidDeadline', r.bid_deadline,
    'phaseDeadline', r.phase_deadline,
    'stateVersion', r.state_version,
    'serverTime', clock_timestamp(),
    'createdAt', r.created_at,
    'updatedAt', r.updated_at,
    'captains', case when r.status in ('cancelled', 'expired') then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'side', c.side,
        'teamName', c.team_name,
        'profileNickname', up.nickname,
        'ready', c.ready,
        'budgetRemaining', c.budget_remaining,
        'isCurrentUser', c.user_id = p_viewer_id
      ) order by c.side)
      from public.auction_captains c
      join public.user_profiles up on up.id = c.user_id
      where c.room_id = r.id
    ), '[]'::jsonb) end,
    'players', case when r.status in ('cancelled', 'expired') then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'gameName', p.game_name,
        'tagLine', p.tag_line,
        'rank', p.rank_snapshot,
        'drawPosition', case when r.order_visible or p.revealed then p.draw_position else null end,
        'revealed', p.revealed,
        'assignedSide', p.assigned_side,
        'purchasePrice', p.purchase_price
      ) order by p.draw_position nulls last, p.created_at, p.id)
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

create or replace function public.auction_list_active()
returns table(room jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id,
    'status', r.status,
    'phase', r.phase,
    'teamA', coalesce(a.team_name, 'Team A'),
    'teamB', coalesce(b.team_name, 'Team B'),
    'captainA', ua.nickname,
    'captainB', ub.nickname,
    'currentPlayer', cp.game_name || '#' || cp.tag_line,
    'currentBid', r.current_bid,
    'countdownEndsAt', r.countdown_ends_at,
    'bidDeadline', r.bid_deadline,
    'phaseDeadline', r.phase_deadline,
    'stateVersion', r.state_version,
    'updatedAt', r.updated_at,
    'serverTime', clock_timestamp()
  )
  from public.auction_rooms r
  join public.auction_captains a on a.room_id = r.id and a.side = 'A'
  join public.user_profiles ua on ua.id = a.user_id
  left join public.auction_captains b on b.room_id = r.id and b.side = 'B'
  left join public.user_profiles ub on ub.id = b.user_id
  left join public.auction_players cp on cp.id = r.current_player_id
  where r.status in ('countdown', 'active')
  order by r.updated_at desc, r.id;
$$;

-- ---- round flow ------------------------------------------------------------------------------

-- Gives the current player to a side at a price, then either completes the auction (a side has
-- four players, so the rest go to the other side for $0) or pauses before the next round.
create function public._auction_award_locked(
  p_room_id uuid,
  p_side text,
  p_amount integer,
  p_reason text,
  p_request_id uuid default null,
  p_actor_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player_id uuid;
  v_other text := case p_side when 'A' then 'B' else 'A' end;
  v_count integer;
  v_player record;
begin
  select current_player_id into v_player_id from public.auction_rooms where id = p_room_id;
  if v_player_id is null then return; end if;

  update public.auction_players
  set assigned_side = p_side, purchase_price = p_amount
  where id = v_player_id and assigned_side is null;
  if not found then return; end if;
  update public.auction_captains
  set budget_remaining = budget_remaining - p_amount
  where room_id = p_room_id and side = p_side;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id, amount, payload)
  values (p_room_id, p_request_id, 'sold', p_actor_user_id, p_side, v_player_id, p_amount,
          jsonb_build_object('reason', p_reason));

  select count(*) into v_count
  from public.auction_players
  where room_id = p_room_id and assigned_side = p_side;

  if v_count = 4 then
    for v_player in
      select id from public.auction_players
      where room_id = p_room_id and assigned_side is null
      order by draw_position nulls last, id
      for update
    loop
      update public.auction_players
      set assigned_side = v_other, purchase_price = 0, revealed = true
      where id = v_player.id;
      insert into public.auction_events(room_id, event_type, actor_side, player_id, amount)
      values (p_room_id, 'auto_assigned', v_other, v_player.id, 0);
    end loop;
    perform public._auction_set_terminal_locked(p_room_id, 'completed');
    insert into public.auction_events(room_id, event_type) values (p_room_id, 'completed');
  else
    update public.auction_rooms
    set phase = 'sold_pause', phase_deadline = clock_timestamp() + interval '3 seconds',
        bid_deadline = null,
        current_bid = p_amount, leading_side = case when p_amount > 0 then p_side end,
        updated_at = clock_timestamp(), last_activity_at = clock_timestamp(),
        state_version = state_version + 1
    where id = p_room_id and status = 'active';
  end if;
end;
$$;

-- The leading captain buys the current player at the current bid.
create or replace function public._auction_sell_locked(p_room_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_side text;
  v_amount integer;
begin
  select leading_side, current_bid into v_side, v_amount
  from public.auction_rooms where id = p_room_id;
  if v_side is null then return; end if;
  perform public._auction_award_locked(p_room_id, v_side, v_amount, p_reason);
end;
$$;

-- Both captains are out of money: the rest of the pool goes for $0, alternating from p_first_side
-- in draw order. A side with four players drops out of the rotation.
create function public._auction_share_rest_locked(p_room_id uuid, p_first_side text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_side text := p_first_side;
  v_player record;
begin
  for v_player in
    select id from public.auction_players
    where room_id = p_room_id and assigned_side is null
    order by draw_position nulls last, random()
    for update
  loop
    if (select count(*) from public.auction_players
        where room_id = p_room_id and assigned_side = v_side) >= 4 then
      v_side := case v_side when 'A' then 'B' else 'A' end;
    end if;
    update public.auction_players
    set assigned_side = v_side, purchase_price = 0, revealed = true
    where id = v_player.id;
    insert into public.auction_events(room_id, event_type, actor_side, player_id, amount)
    values (p_room_id, 'auto_assigned', v_side, v_player.id, 0);
    v_side := case v_side when 'A' then 'B' else 'A' end;
  end loop;
  perform public._auction_set_terminal_locked(p_room_id, 'completed');
  insert into public.auction_events(room_id, event_type) values (p_room_id, 'completed');
end;
$$;

-- Starts the next round: reveals a player and opens it with $1 for the round's opener.
create or replace function public._auction_reveal_next_locked(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.auction_rooms%rowtype;
  v_round smallint;
  v_opener text;
  v_other text;
  v_opener_budget integer;
  v_other_budget integer;
  v_player_id uuid;
  v_next_position smallint;
begin
  select * into v_room from public.auction_rooms where id = p_room_id;
  v_round := v_room.round_number + 1;
  v_opener := case when v_round % 2 = 1 then v_room.first_opener_side
                   when v_room.first_opener_side = 'A' then 'B' else 'A' end;
  v_other := case v_opener when 'A' then 'B' else 'A' end;
  select budget_remaining into v_opener_budget
  from public.auction_captains where room_id = p_room_id and side = v_opener;
  select budget_remaining into v_other_budget
  from public.auction_captains where room_id = p_room_id and side = v_other;

  if v_opener_budget = 0 and v_other_budget = 0 then
    perform public._auction_share_rest_locked(p_room_id, v_opener);
    return;
  end if;

  if v_room.order_visible then
    select id into v_player_id
    from public.auction_players
    where room_id = p_room_id and assigned_side is null and not revealed
    order by draw_position
    limit 1;
  else
    select id into v_player_id
    from public.auction_players
    where room_id = p_room_id and assigned_side is null and not revealed
    order by random()
    limit 1;
    select coalesce(max(draw_position), 0) + 1 into v_next_position
    from public.auction_players where room_id = p_room_id;
    update public.auction_players set draw_position = v_next_position where id = v_player_id;
  end if;

  if v_player_id is null then
    perform public._auction_set_terminal_locked(p_room_id, 'completed');
    insert into public.auction_events(room_id, event_type) values (p_room_id, 'completed');
    return;
  end if;

  -- A captain with no money cannot open; the other captain opens this round instead.
  if v_opener_budget = 0 then
    v_opener := v_other;
    v_other := case v_opener when 'A' then 'B' else 'A' end;
    v_opener_budget := v_other_budget;
    v_other_budget := 0;
  end if;

  update public.auction_players set revealed = true where id = v_player_id;
  insert into public.auction_events(room_id, event_type, player_id)
  values (p_room_id, 'player_revealed', v_player_id);
  insert into public.auction_events(room_id, event_type, actor_side, player_id, amount)
  values (p_room_id, 'opening_bid', v_opener, v_player_id, 1);

  if v_other_budget = 0 then
    -- Free auction: the opener takes the player for $1 (also on timeout) or passes.
    update public.auction_rooms
    set current_player_id = v_player_id, current_bid = 1, leading_side = v_opener,
        round_number = v_round, phase = 'free_auction', bid_deadline = null,
        phase_deadline = clock_timestamp() + make_interval(secs => bid_seconds),
        updated_at = clock_timestamp(), last_activity_at = clock_timestamp(),
        state_version = state_version + 1
    where id = p_room_id;
  else
    update public.auction_rooms
    set current_player_id = v_player_id, current_bid = 1, leading_side = v_opener,
        round_number = v_round, phase = 'bidding',
        bid_deadline = clock_timestamp() + make_interval(secs => bid_seconds), phase_deadline = null,
        updated_at = clock_timestamp(), last_activity_at = clock_timestamp(),
        state_version = state_version + 1
    where id = p_room_id;
    if v_other_budget < 2 then
      perform public._auction_sell_locked(p_room_id, 'opponent_cannot_raise');
    end if;
  end if;
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
      where room_id = p_room_id
    )
    update public.auction_players p set draw_position = s.position
    from shuffled s where p.id = s.id;
  end if;
  -- The sold pause is transient here: the reveal below sets the first round's phase.
  update public.auction_rooms
  set status = 'active', phase = 'sold_pause', phase_deadline = clock_timestamp(),
      countdown_ends_at = null, round_number = 0,
      first_opener_side = case when random() < 0.5 then 'A' else 'B' end,
      updated_at = clock_timestamp(), last_activity_at = clock_timestamp(), state_version = state_version + 1
  where id = p_room_id and status = 'countdown';
  insert into public.auction_events(room_id, event_type) values (p_room_id, 'auction_started');
  perform public._auction_reveal_next_locked(p_room_id);
end;
$$;

-- ---- lobby commands --------------------------------------------------------------------------

create function public.auction_create_room(
  p_request_id uuid,
  p_players jsonb,
  p_team_name text,
  p_starting_budget integer,
  p_bid_seconds integer,
  p_order_visible boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public._auction_actor_id();
  v_seen_room uuid;
  v_room_id uuid := gen_random_uuid();
  v_player jsonb;
begin
  if p_request_id is null then perform public._auction_fail('AUCTION_REQUEST_ID_REQUIRED'); end if;
  v_seen_room := public._auction_request_room(p_request_id, v_user_id);
  if v_seen_room is not null then return public._auction_snapshot(v_seen_room, v_user_id); end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  v_seen_room := public._auction_request_room(p_request_id, v_user_id);
  if v_seen_room is not null then return public._auction_snapshot(v_seen_room, v_user_id); end if;
  if exists (
    select 1 from public.auction_captains where user_id = v_user_id and active_slot
  ) then perform public._auction_fail('AUCTION_ALREADY_CAPTAIN'); end if;
  if jsonb_typeof(p_players) <> 'array' or jsonb_array_length(p_players) <> 8 then
    perform public._auction_fail('AUCTION_PLAYERS_INVALID');
  end if;
  if p_starting_budget not between 4 and 100 then perform public._auction_fail('AUCTION_BUDGET_INVALID'); end if;
  if p_bid_seconds not between 10 and 60 then perform public._auction_fail('AUCTION_BID_SECONDS_INVALID'); end if;
  if length(btrim(p_team_name)) not between 1 and 100 then perform public._auction_fail('AUCTION_TEAM_NAME_INVALID'); end if;

  insert into public.auction_rooms(id, creator_id, starting_budget, bid_seconds, order_visible)
  values (v_room_id, v_user_id, p_starting_budget, p_bid_seconds, p_order_visible);
  for v_player in select value from jsonb_array_elements(p_players)
  loop
    if jsonb_typeof(v_player) <> 'object'
      or nullif(btrim(v_player->>'gameName'), '') is null
      or nullif(btrim(v_player->>'tagLine'), '') is null then
      perform public._auction_fail('AUCTION_PLAYERS_INVALID');
    end if;
    insert into public.auction_players(room_id, game_name, tag_line, rank_snapshot)
    values (
      v_room_id, btrim(v_player->>'gameName'), btrim(v_player->>'tagLine'),
      case when jsonb_typeof(v_player->'rank') = 'object' then v_player->'rank' else '{}'::jsonb end
    );
  end loop;
  insert into public.auction_captains(room_id, side, user_id, team_name, budget_remaining)
  values (v_room_id, 'A', v_user_id, btrim(p_team_name), p_starting_budget);
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side)
  values (v_room_id, p_request_id, 'created', v_user_id, 'A');
  return public._auction_snapshot(v_room_id, v_user_id);
exception
  when unique_violation then
    perform public._auction_fail('AUCTION_PLAYERS_NOT_UNIQUE');
    return null;
end;
$$;

create function public.auction_join_captain(
  p_room_id uuid,
  p_request_id uuid,
  p_team_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public._auction_actor_id();
  v_room public.auction_rooms%rowtype;
  v_seen uuid;
begin
  if p_request_id is null then perform public._auction_fail('AUCTION_REQUEST_ID_REQUIRED'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then
    if v_seen <> p_room_id then perform public._auction_fail('AUCTION_IDEMPOTENCY_KEY_REUSED'); end if;
    return public._auction_snapshot(p_room_id, v_user_id);
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  select * into v_room from public.auction_rooms where id = p_room_id for update;
  if not found then perform public._auction_fail('AUCTION_ROOM_NOT_FOUND'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  if v_room.status <> 'waiting' then perform public._auction_fail('AUCTION_ROOM_NOT_WAITING'); end if;
  if v_room.creator_id = v_user_id then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;
  if exists (select 1 from public.auction_captains where user_id = v_user_id and active_slot) then
    perform public._auction_fail('AUCTION_ALREADY_CAPTAIN');
  end if;
  if exists (select 1 from public.auction_captains where room_id = p_room_id and side = 'B') then
    perform public._auction_fail('AUCTION_CAPTAIN_SLOT_TAKEN');
  end if;
  if length(btrim(p_team_name)) not between 1 and 100 then perform public._auction_fail('AUCTION_TEAM_NAME_INVALID'); end if;
  insert into public.auction_captains(room_id, side, user_id, team_name, budget_remaining)
  values (p_room_id, 'B', v_user_id, btrim(p_team_name), v_room.starting_budget);
  update public.auction_captains set ready = false where room_id = p_room_id;
  update public.auction_rooms set state_version = state_version + 1, updated_at = clock_timestamp(), last_activity_at = clock_timestamp()
  where id = p_room_id;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side)
  values (p_room_id, p_request_id, 'captain_joined', v_user_id, 'B');
  return public._auction_snapshot(p_room_id, v_user_id);
exception when unique_violation then
  perform public._auction_fail('AUCTION_CAPTAIN_SLOT_TAKEN');
  return null;
end;
$$;

create or replace function public.auction_leave_captain(p_room_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public._auction_actor_id();
  v_room public.auction_rooms%rowtype;
  v_seen uuid;
begin
  if p_request_id is null then perform public._auction_fail('AUCTION_REQUEST_ID_REQUIRED'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  select * into v_room from public.auction_rooms where id = p_room_id for update;
  if not found then perform public._auction_fail('AUCTION_ROOM_NOT_FOUND'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  if v_room.status not in ('waiting', 'countdown') then perform public._auction_fail('AUCTION_ROOM_STARTED'); end if;
  delete from public.auction_captains where room_id = p_room_id and side = 'B' and user_id = v_user_id;
  if not found then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;
  update public.auction_captains set ready = false where room_id = p_room_id;
  update public.auction_rooms
  set status = 'waiting', phase = null, countdown_ends_at = null, state_version = state_version + 1,
      updated_at = clock_timestamp(), last_activity_at = clock_timestamp()
  where id = p_room_id;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side)
  values (p_room_id, p_request_id, 'captain_left', v_user_id, 'B');
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

create or replace function public.auction_remove_captain(p_room_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public._auction_actor_id();
  v_room public.auction_rooms%rowtype;
  v_seen uuid;
begin
  if p_request_id is null then perform public._auction_fail('AUCTION_REQUEST_ID_REQUIRED'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  select * into v_room from public.auction_rooms where id = p_room_id for update;
  if not found then perform public._auction_fail('AUCTION_ROOM_NOT_FOUND'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  if v_room.creator_id <> v_user_id then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;
  if v_room.status not in ('waiting', 'countdown') then perform public._auction_fail('AUCTION_ROOM_STARTED'); end if;
  delete from public.auction_captains where room_id = p_room_id and side = 'B';
  if not found then perform public._auction_fail('AUCTION_CAPTAIN_SLOT_EMPTY'); end if;
  update public.auction_captains set ready = false where room_id = p_room_id;
  update public.auction_rooms
  set status = 'waiting', phase = null, countdown_ends_at = null, state_version = state_version + 1,
      updated_at = clock_timestamp(), last_activity_at = clock_timestamp()
  where id = p_room_id;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side)
  values (p_room_id, p_request_id, 'captain_removed', v_user_id, 'A');
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

create or replace function public.auction_update_lobby(
  p_room_id uuid,
  p_request_id uuid,
  p_starting_budget integer,
  p_bid_seconds integer,
  p_order_visible boolean,
  p_players jsonb,
  p_team_name text
)
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
  v_player jsonb;
begin
  if p_request_id is null then perform public._auction_fail('AUCTION_REQUEST_ID_REQUIRED'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  select * into v_room from public.auction_rooms where id = p_room_id for update;
  if not found then perform public._auction_fail('AUCTION_ROOM_NOT_FOUND'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  if v_room.status not in ('waiting', 'countdown') then perform public._auction_fail('AUCTION_ROOM_STARTED'); end if;
  select side into v_side from public.auction_captains where room_id = p_room_id and user_id = v_user_id;
  if v_side is null then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;
  if p_team_name is not null then
    if length(btrim(p_team_name)) not between 1 and 100 then perform public._auction_fail('AUCTION_TEAM_NAME_INVALID'); end if;
    update public.auction_captains set team_name = btrim(p_team_name) where room_id = p_room_id and side = v_side;
  end if;
  if p_starting_budget is not null or p_bid_seconds is not null or p_order_visible is not null or p_players is not null then
    if v_room.creator_id <> v_user_id then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;
    if p_starting_budget is not null and p_starting_budget not between 4 and 100 then perform public._auction_fail('AUCTION_BUDGET_INVALID'); end if;
    if p_bid_seconds is not null and p_bid_seconds not between 10 and 60 then perform public._auction_fail('AUCTION_BID_SECONDS_INVALID'); end if;
    update public.auction_rooms set
      starting_budget = coalesce(p_starting_budget, starting_budget),
      bid_seconds = coalesce(p_bid_seconds, bid_seconds),
      order_visible = coalesce(p_order_visible, order_visible)
    where id = p_room_id;
    if p_starting_budget is not null then
      update public.auction_captains set budget_remaining = p_starting_budget where room_id = p_room_id;
    end if;
    if p_players is not null then
      if jsonb_typeof(p_players) <> 'array' or jsonb_array_length(p_players) <> 8 then
        perform public._auction_fail('AUCTION_PLAYERS_INVALID');
      end if;
      delete from public.auction_players where room_id = p_room_id;
      for v_player in select value from jsonb_array_elements(p_players)
      loop
        if jsonb_typeof(v_player) <> 'object'
          or nullif(btrim(v_player->>'gameName'), '') is null
          or nullif(btrim(v_player->>'tagLine'), '') is null then
          perform public._auction_fail('AUCTION_PLAYERS_INVALID');
        end if;
        insert into public.auction_players(room_id, game_name, tag_line, rank_snapshot)
        values (p_room_id, btrim(v_player->>'gameName'), btrim(v_player->>'tagLine'),
          case when jsonb_typeof(v_player->'rank') = 'object' then v_player->'rank' else '{}'::jsonb end);
      end loop;
    end if;
  end if;
  update public.auction_captains set ready = false where room_id = p_room_id;
  update public.auction_rooms
  set status = 'waiting', countdown_ends_at = null, state_version = state_version + 1,
      updated_at = clock_timestamp(), last_activity_at = clock_timestamp()
  where id = p_room_id;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side)
  values (p_room_id, p_request_id, 'lobby_updated', v_user_id, v_side);
  return public._auction_snapshot(p_room_id, v_user_id);
exception when unique_violation then
  perform public._auction_fail('AUCTION_PLAYERS_NOT_UNIQUE');
  return null;
end;
$$;

-- ---- round commands --------------------------------------------------------------------------

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
  v_budget integer;
  v_other_budget integer;
  v_seen uuid;
begin
  if p_request_id is null then perform public._auction_fail('AUCTION_REQUEST_ID_REQUIRED'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  select * into v_room from public.auction_rooms where id = p_room_id for update;
  if not found then perform public._auction_fail('AUCTION_ROOM_NOT_FOUND'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  if v_room.status <> 'active' or v_room.phase <> 'bidding' then
    perform public._auction_fail('AUCTION_BIDDING_CLOSED');
  end if;
  if clock_timestamp() >= v_room.bid_deadline then
    perform public._auction_fail('AUCTION_DEADLINE_PASSED');
  end if;
  select side, budget_remaining into v_side, v_budget from public.auction_captains
  where room_id = p_room_id and user_id = v_user_id;
  if v_side is null then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;
  if v_side = v_room.leading_side then perform public._auction_fail('AUCTION_LEADER_CANNOT_BID'); end if;
  if p_amount is null or p_amount < v_room.current_bid + 1 then
    perform public._auction_fail('AUCTION_BID_TOO_LOW');
  end if;
  if p_amount > v_budget then
    perform public._auction_fail('AUCTION_BUDGET_EXCEEDED');
  end if;
  update public.auction_rooms
  set current_bid = p_amount, leading_side = v_side,
      bid_deadline = clock_timestamp() + make_interval(secs => bid_seconds),
      updated_at = clock_timestamp(), last_activity_at = clock_timestamp(), state_version = state_version + 1
  where id = p_room_id;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id, amount)
  values (p_room_id, p_request_id, 'bid', v_user_id, v_side, v_room.current_player_id, p_amount);

  select budget_remaining into v_other_budget from public.auction_captains
  where room_id = p_room_id and side <> v_side;
  if v_other_budget < p_amount + 1 then
    perform public._auction_sell_locked(p_room_id, 'opponent_cannot_raise');
  end if;
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

-- Giving up the round: while bidding the non-leader concedes to the leader; in a free auction the
-- leader passes the player to the captain with no money, for $0.
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
  if v_room.status <> 'active' or v_room.phase not in ('bidding', 'free_auction') then
    perform public._auction_fail('AUCTION_PASS_NOT_ALLOWED');
  end if;
  if v_room.phase = 'bidding' and clock_timestamp() >= v_room.bid_deadline then
    perform public._auction_fail('AUCTION_DEADLINE_PASSED');
  end if;
  if v_room.phase = 'free_auction' and clock_timestamp() >= v_room.phase_deadline then
    perform public._auction_fail('AUCTION_DEADLINE_PASSED');
  end if;
  select side into v_side from public.auction_captains where room_id = p_room_id and user_id = v_user_id;
  if v_side is null then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;

  if v_room.phase = 'bidding' then
    if v_side = v_room.leading_side then perform public._auction_fail('AUCTION_LEADER_CANNOT_PASS'); end if;
    insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id)
    values (p_room_id, p_request_id, 'concede', v_user_id, v_side, v_room.current_player_id);
    perform public._auction_sell_locked(p_room_id, 'concede');
  else
    if v_side <> v_room.leading_side then perform public._auction_fail('AUCTION_PASS_NOT_ALLOWED'); end if;
    insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id)
    values (p_room_id, p_request_id, 'pass', v_user_id, v_side, v_room.current_player_id);
    perform public._auction_award_locked(
      p_room_id, case v_side when 'A' then 'B' else 'A' end, 0, 'pass'
    );
  end if;
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

-- In a free auction the leader takes the player for $1 without waiting for the deadline.
create function public.auction_take(p_room_id uuid, p_request_id uuid)
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
  if v_room.status <> 'active' or v_room.phase <> 'free_auction' then
    perform public._auction_fail('AUCTION_TAKE_NOT_ALLOWED');
  end if;
  select side into v_side from public.auction_captains where room_id = p_room_id and user_id = v_user_id;
  if v_side is null or v_side <> v_room.leading_side then
    perform public._auction_fail('AUCTION_PERMISSION_DENIED');
  end if;
  perform public._auction_award_locked(
    p_room_id, v_side, v_room.current_bid, 'take', p_request_id, v_user_id
  );
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

create or replace function public.auction_tick()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.auction_rooms%rowtype;
  v_processed integer := 0;
  v_deleted integer := 0;
  v_now timestamptz := clock_timestamp();
begin
  if not pg_try_advisory_xact_lock(hashtextextended('public.auction_tick', 0)) then return 0; end if;
  for v_room in
    select * from public.auction_rooms
    where (status = 'countdown' and countdown_ends_at <= v_now)
       or (status = 'active' and phase = 'bidding' and bid_deadline <= v_now)
       or (status = 'active' and phase in ('free_auction', 'sold_pause') and phase_deadline <= v_now)
       or (status = 'active' and last_activity_at <= v_now - interval '2 hours')
       or (status = 'waiting' and last_activity_at <= v_now - interval '24 hours')
    order by coalesce(countdown_ends_at, bid_deadline, phase_deadline, last_activity_at)
    for update skip locked
    limit 100
  loop
    if v_room.status = 'countdown' and v_room.countdown_ends_at <= v_now then
      if (select count(*) = 2 and bool_and(ready) from public.auction_captains where room_id = v_room.id) then
        perform public._auction_start_locked(v_room.id);
      else
        update public.auction_rooms set status = 'waiting', countdown_ends_at = null,
          state_version = state_version + 1, updated_at = v_now where id = v_room.id;
      end if;
    elsif v_room.status = 'active' and v_room.phase in ('bidding', 'free_auction')
      and coalesce(v_room.bid_deadline, v_room.phase_deadline) <= v_now then
      perform public._auction_sell_locked(v_room.id, 'deadline');
    elsif v_room.status = 'active' and v_room.phase = 'sold_pause' and v_room.phase_deadline <= v_now then
      perform public._auction_reveal_next_locked(v_room.id);
    elsif (v_room.status = 'active' and v_room.last_activity_at <= v_now - interval '2 hours')
       or (v_room.status = 'waiting' and v_room.last_activity_at <= v_now - interval '24 hours') then
      perform public._auction_set_terminal_locked(v_room.id, 'expired');
      insert into public.auction_events(room_id, event_type) values (v_room.id, 'expired');
    end if;
    v_processed := v_processed + 1;
  end loop;

  with doomed as (
    select id from public.auction_rooms
    where terminal_at <= v_now - interval '24 hours'
    order by terminal_at
    for update skip locked
    limit 100
  )
  delete from public.auction_rooms r using doomed d where r.id = d.id;
  get diagnostics v_deleted = row_count;
  return v_processed + v_deleted;
end;
$$;

-- ---- privileges ------------------------------------------------------------------------------

revoke execute on function public._auction_award_locked(uuid, text, integer, text, uuid, uuid) from public, anon, authenticated, service_role;
revoke execute on function public._auction_share_rest_locked(uuid, text) from public, anon, authenticated, service_role;
revoke execute on function public.auction_create_room(uuid, jsonb, text, integer, integer, boolean) from public, anon, authenticated, service_role;
revoke execute on function public.auction_join_captain(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke execute on function public.auction_take(uuid, uuid) from public, anon, authenticated, service_role;

grant execute on function public.auction_create_room(uuid, jsonb, text, integer, integer, boolean) to authenticated, service_role;
grant execute on function public.auction_join_captain(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.auction_take(uuid, uuid) to authenticated, service_role;
