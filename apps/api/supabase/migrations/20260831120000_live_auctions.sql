create extension if not exists pg_cron with schema pg_catalog;

create table public.auction_rooms (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting'
    check (status in ('waiting', 'countdown', 'active', 'completed', 'cancelled', 'expired')),
  phase text check (phase is null or phase in ('awaiting_opening_bid', 'bidding', 'sold_pause')),
  starting_budget integer not null default 20 check (starting_budget between 4 and 100),
  bid_seconds integer not null default 30 check (bid_seconds between 10 and 60),
  order_visible boolean not null default false,
  current_player_id uuid,
  current_bid integer not null default 0 check (current_bid >= 0),
  leading_side text check (leading_side is null or leading_side in ('A', 'B')),
  countdown_ends_at timestamptz,
  bid_deadline timestamptz,
  phase_deadline timestamptz,
  state_version bigint not null default 1 check (state_version > 0),
  last_activity_at timestamptz not null default clock_timestamp(),
  terminal_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check (
    (status = 'active' and phase is not null)
    or (status <> 'active' and phase is null)
  ),
  check ((status = 'countdown') = (countdown_ends_at is not null)),
  check ((phase = 'bidding') = (bid_deadline is not null)),
  check ((phase = 'sold_pause') = (phase_deadline is not null)),
  check ((status in ('completed', 'cancelled', 'expired')) = (terminal_at is not null)),
  check ((current_bid = 0 and leading_side is null) or (current_bid > 0 and leading_side is not null))
);

create table public.auction_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.auction_rooms(id) on delete cascade,
  game_name text not null check (length(btrim(game_name)) between 1 and 100),
  tag_line text not null check (length(btrim(tag_line)) between 1 and 20),
  riot_id_normalized text generated always as (
    lower(btrim(game_name)) || '#' || lower(btrim(tag_line))
  ) stored,
  rank_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(rank_snapshot) = 'object'),
  draw_position smallint check (draw_position between 1 and 8),
  revealed boolean not null default false,
  assigned_side text check (assigned_side is null or assigned_side in ('A', 'B')),
  purchase_price integer check (purchase_price is null or purchase_price between 0 and 100),
  is_captain boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  unique (room_id, riot_id_normalized),
  unique (room_id, draw_position),
  check ((assigned_side is null and purchase_price is null) or (assigned_side is not null and purchase_price is not null)),
  check (not is_captain or (assigned_side is not null and purchase_price = 0 and revealed))
);

alter table public.auction_rooms
  add constraint auction_rooms_current_player_fkey
  foreign key (current_player_id) references public.auction_players(id) on delete set null;

create table public.auction_captains (
  room_id uuid not null references public.auction_rooms(id) on delete cascade,
  side text not null check (side in ('A', 'B')),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.auction_players(id) on delete restrict,
  team_name text not null check (length(btrim(team_name)) between 1 and 100),
  ready boolean not null default false,
  budget_remaining integer not null check (budget_remaining between 0 and 100),
  active_slot boolean not null default true,
  joined_at timestamptz not null default clock_timestamp(),
  primary key (room_id, side),
  unique (room_id, user_id),
  unique (room_id, player_id)
);

create unique index auction_captains_one_active_room_per_user
  on public.auction_captains(user_id)
  where active_slot;

create table public.auction_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.auction_rooms(id) on delete cascade,
  request_id uuid,
  event_type text not null check (event_type in (
    'created', 'captain_joined', 'captain_left', 'captain_removed', 'lobby_updated',
    'ready_changed', 'countdown_started', 'countdown_cancelled', 'auction_started',
    'player_revealed', 'bid', 'pass', 'sold', 'auto_assigned', 'completed',
    'cancelled', 'expired'
  )),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_side text check (actor_side is null or actor_side in ('A', 'B')),
  player_id uuid references public.auction_players(id) on delete cascade,
  amount integer check (amount is null or amount between 0 and 100),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default clock_timestamp()
);

create unique index auction_events_request_id_unique
  on public.auction_events(request_id)
  where request_id is not null;
create unique index auction_events_one_sale_per_player
  on public.auction_events(room_id, player_id)
  where event_type = 'sold';
create index auction_events_room_feed_idx on public.auction_events(room_id, id);
create index auction_rooms_public_list_idx on public.auction_rooms(status, updated_at desc)
  where status in ('countdown', 'active');
create index auction_rooms_countdown_idx on public.auction_rooms(countdown_ends_at)
  where status = 'countdown';
create index auction_rooms_bid_deadline_idx on public.auction_rooms(bid_deadline)
  where status = 'active' and phase = 'bidding';
create index auction_rooms_phase_deadline_idx on public.auction_rooms(phase_deadline)
  where status = 'active' and phase = 'sold_pause';
create index auction_rooms_activity_idx on public.auction_rooms(status, last_activity_at);
create index auction_rooms_retention_idx on public.auction_rooms(terminal_at)
  where terminal_at is not null;
create index auction_players_available_idx on public.auction_players(room_id, draw_position, id)
  where assigned_side is null and not is_captain;

alter table public.auction_rooms enable row level security;
alter table public.auction_players enable row level security;
alter table public.auction_captains enable row level security;
alter table public.auction_events enable row level security;

revoke all on table public.auction_rooms from public, anon, authenticated;
revoke all on table public.auction_players from public, anon, authenticated;
revoke all on table public.auction_captains from public, anon, authenticated;
revoke all on table public.auction_events from public, anon, authenticated;
revoke all on sequence public.auction_events_id_seq from public, anon, authenticated;
grant all on table public.auction_rooms, public.auction_players, public.auction_captains, public.auction_events to service_role;
grant usage, select on sequence public.auction_events_id_seq to service_role;

create function public._auction_fail(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using errcode = 'P0001', message = p_code;
end;
$$;

create function public._auction_actor_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or not exists (
    select 1 from public.user_profiles where id = v_user_id
  ) then
    perform public._auction_fail('AUCTION_PROFILE_REQUIRED');
  end if;
  return v_user_id;
end;
$$;

create function public._auction_request_room(p_request_id uuid, p_actor_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
  v_owner_id uuid;
begin
  select room_id, actor_user_id into v_room_id, v_owner_id
  from public.auction_events
  where request_id = p_request_id;
  if v_room_id is not null and v_owner_id is distinct from p_actor_id then
    perform public._auction_fail('AUCTION_IDEMPOTENCY_KEY_REUSED');
  end if;
  return v_room_id;
end;
$$;

create function public._auction_snapshot(p_room_id uuid, p_viewer_id uuid)
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

create function public.auction_get_room(p_room_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public._auction_snapshot(p_room_id, auth.uid());
$$;

create function public.auction_list_active()
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
    'captainA', pa.game_name || '#' || pa.tag_line,
    'captainB', pb.game_name || '#' || pb.tag_line,
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
  join public.auction_players pa on pa.id = a.player_id
  left join public.auction_captains b on b.room_id = r.id and b.side = 'B'
  left join public.auction_players pb on pb.id = b.player_id
  left join public.auction_players cp on cp.id = r.current_player_id
  where r.status in ('countdown', 'active')
  order by r.updated_at desc, r.id;
$$;

create function public._auction_set_terminal_locked(p_room_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.auction_rooms
  set status = p_status,
      phase = null,
      countdown_ends_at = null,
      bid_deadline = null,
      phase_deadline = null,
      terminal_at = clock_timestamp(),
      updated_at = clock_timestamp(),
      last_activity_at = clock_timestamp(),
      state_version = state_version + 1
  where id = p_room_id and status not in ('completed', 'cancelled', 'expired');
  update public.auction_captains set active_slot = false, ready = false where room_id = p_room_id;
end;
$$;

create function public._auction_reveal_next_locked(p_room_id uuid)
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
  from public.auction_players where room_id = p_room_id and revealed and not is_captain;

  if v_visible then
    select id into v_player_id
    from public.auction_players
    where room_id = p_room_id and assigned_side is null and not is_captain
    order by draw_position
    limit 1;
  else
    select id into v_player_id
    from public.auction_players
    where room_id = p_room_id and assigned_side is null and not is_captain
    order by random()
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
      updated_at = clock_timestamp(),
      last_activity_at = clock_timestamp(),
      state_version = state_version + 1
  where id = p_room_id;
  insert into public.auction_events(room_id, event_type, player_id)
  values (p_room_id, 'player_revealed', v_player_id);
end;
$$;

create function public._auction_start_locked(p_room_id uuid)
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
      updated_at = clock_timestamp(), last_activity_at = clock_timestamp(), state_version = state_version + 1
  where id = p_room_id and status = 'countdown';
  insert into public.auction_events(room_id, event_type) values (p_room_id, 'auction_started');
  perform public._auction_reveal_next_locked(p_room_id);
end;
$$;

create function public._auction_sell_locked(p_room_id uuid, p_reason text)
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
      set assigned_side = v_loser, purchase_price = 1, revealed = true
      where id = v_player.id;
      update public.auction_captains
      set budget_remaining = budget_remaining - 1
      where room_id = p_room_id and side = v_loser;
      insert into public.auction_events(room_id, event_type, actor_side, player_id, amount)
      values (p_room_id, 'auto_assigned', v_loser, v_player.id, 1);
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

create function public.auction_create_room(
  p_request_id uuid,
  p_players jsonb,
  p_captain_riot_id text,
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
  v_player_id uuid;
  v_captain_id uuid;
  v_captain_normalized text := lower(btrim(p_captain_riot_id));
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
  if jsonb_typeof(p_players) <> 'array' or jsonb_array_length(p_players) <> 10 then
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
    )
    returning id into v_player_id;
    if lower(btrim(v_player->>'gameName') || '#' || btrim(v_player->>'tagLine')) = v_captain_normalized then
      v_captain_id := v_player_id;
    end if;
  end loop;
  if v_captain_id is null then perform public._auction_fail('AUCTION_CAPTAIN_PLAYER_INVALID'); end if;
  update public.auction_players
  set is_captain = true, assigned_side = 'A', purchase_price = 0, revealed = true
  where id = v_captain_id;
  insert into public.auction_captains(room_id, side, user_id, player_id, team_name, budget_remaining)
  values (v_room_id, 'A', v_user_id, v_captain_id, btrim(p_team_name), p_starting_budget);
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id)
  values (v_room_id, p_request_id, 'created', v_user_id, 'A', v_captain_id);
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
  p_player_id uuid,
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
  if not exists (
    select 1 from public.auction_players
    where id = p_player_id and room_id = p_room_id and assigned_side is null and not is_captain
    for update
  ) then perform public._auction_fail('AUCTION_CAPTAIN_PLAYER_INVALID'); end if;
  update public.auction_players
  set is_captain = true, assigned_side = 'B', purchase_price = 0, revealed = true
  where id = p_player_id;
  insert into public.auction_captains(room_id, side, user_id, player_id, team_name, budget_remaining)
  values (p_room_id, 'B', v_user_id, p_player_id, btrim(p_team_name), v_room.starting_budget);
  update public.auction_captains set ready = false where room_id = p_room_id;
  update public.auction_rooms set state_version = state_version + 1, updated_at = clock_timestamp(), last_activity_at = clock_timestamp()
  where id = p_room_id;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id)
  values (p_room_id, p_request_id, 'captain_joined', v_user_id, 'B', p_player_id);
  return public._auction_snapshot(p_room_id, v_user_id);
exception when unique_violation then
  perform public._auction_fail('AUCTION_CAPTAIN_SLOT_TAKEN');
  return null;
end;
$$;

create function public.auction_leave_captain(p_room_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public._auction_actor_id();
  v_room public.auction_rooms%rowtype;
  v_player_id uuid;
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
  select player_id into v_player_id from public.auction_captains
  where room_id = p_room_id and side = 'B' and user_id = v_user_id;
  if v_player_id is null then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;
  delete from public.auction_captains where room_id = p_room_id and side = 'B';
  update public.auction_players set is_captain = false, assigned_side = null, purchase_price = null, revealed = false
  where id = v_player_id;
  update public.auction_captains set ready = false where room_id = p_room_id;
  update public.auction_rooms
  set status = 'waiting', phase = null, countdown_ends_at = null, state_version = state_version + 1,
      updated_at = clock_timestamp(), last_activity_at = clock_timestamp()
  where id = p_room_id;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id)
  values (p_room_id, p_request_id, 'captain_left', v_user_id, 'B', v_player_id);
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

create function public.auction_remove_captain(p_room_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := public._auction_actor_id();
  v_room public.auction_rooms%rowtype;
  v_player_id uuid;
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
  select player_id into v_player_id from public.auction_captains where room_id = p_room_id and side = 'B';
  if v_player_id is null then perform public._auction_fail('AUCTION_CAPTAIN_SLOT_EMPTY'); end if;
  delete from public.auction_captains where room_id = p_room_id and side = 'B';
  update public.auction_players set is_captain = false, assigned_side = null, purchase_price = null, revealed = false
  where id = v_player_id;
  update public.auction_captains set ready = false where room_id = p_room_id;
  update public.auction_rooms
  set status = 'waiting', phase = null, countdown_ends_at = null, state_version = state_version + 1,
      updated_at = clock_timestamp(), last_activity_at = clock_timestamp()
  where id = p_room_id;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id)
  values (p_room_id, p_request_id, 'captain_removed', v_user_id, 'A', v_player_id);
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

create function public.auction_update_lobby(
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
  v_norm text;
  v_captain_norms text[];
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
      if jsonb_typeof(p_players) <> 'array' or jsonb_array_length(p_players) <> 10 then
        perform public._auction_fail('AUCTION_PLAYERS_INVALID');
      end if;
      select array_agg(p.riot_id_normalized) into v_captain_norms
      from public.auction_captains c join public.auction_players p on p.id = c.player_id
      where c.room_id = p_room_id;
      if exists (
        select 1 from unnest(v_captain_norms) n
        where not exists (
          select 1 from jsonb_array_elements(p_players) j
          where lower(btrim(j->>'gameName') || '#' || btrim(j->>'tagLine')) = n
        )
      ) then perform public._auction_fail('AUCTION_CAPTAIN_PLAYER_IMMUTABLE'); end if;
      delete from public.auction_players where room_id = p_room_id and not is_captain;
      for v_player in select value from jsonb_array_elements(p_players)
      loop
        if jsonb_typeof(v_player) <> 'object'
          or nullif(btrim(v_player->>'gameName'), '') is null
          or nullif(btrim(v_player->>'tagLine'), '') is null then
          perform public._auction_fail('AUCTION_PLAYERS_INVALID');
        end if;
        v_norm := lower(btrim(v_player->>'gameName') || '#' || btrim(v_player->>'tagLine'));
        if v_norm = any(v_captain_norms) then
          update public.auction_players set
            game_name = btrim(v_player->>'gameName'), tag_line = btrim(v_player->>'tagLine'),
            rank_snapshot = case when jsonb_typeof(v_player->'rank') = 'object' then v_player->'rank' else '{}'::jsonb end
          where room_id = p_room_id and riot_id_normalized = v_norm;
        else
          insert into public.auction_players(room_id, game_name, tag_line, rank_snapshot)
          values (p_room_id, btrim(v_player->>'gameName'), btrim(v_player->>'tagLine'),
            case when jsonb_typeof(v_player->'rank') = 'object' then v_player->'rank' else '{}'::jsonb end);
        end if;
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

create function public.auction_set_ready(p_room_id uuid, p_request_id uuid, p_ready boolean)
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
  v_all_ready boolean;
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
  if p_ready and (select count(*) from public.auction_captains where room_id = p_room_id) <> 2 then
    perform public._auction_fail('AUCTION_NEEDS_TWO_CAPTAINS');
  end if;
  update public.auction_captains set ready = p_ready where room_id = p_room_id and side = v_side;
  select count(*) = 2 and bool_and(ready) into v_all_ready from public.auction_captains where room_id = p_room_id;
  if v_all_ready then
    update public.auction_rooms
    set status = 'countdown', countdown_ends_at = clock_timestamp() + interval '5 seconds',
        state_version = state_version + 1, updated_at = clock_timestamp(), last_activity_at = clock_timestamp()
    where id = p_room_id;
    insert into public.auction_events(room_id, event_type) values (p_room_id, 'countdown_started');
  elsif v_room.status = 'countdown' then
    update public.auction_rooms
    set status = 'waiting', countdown_ends_at = null, state_version = state_version + 1,
        updated_at = clock_timestamp(), last_activity_at = clock_timestamp()
    where id = p_room_id;
    insert into public.auction_events(room_id, event_type) values (p_room_id, 'countdown_cancelled');
  else
    update public.auction_rooms set state_version = state_version + 1, updated_at = clock_timestamp(), last_activity_at = clock_timestamp()
    where id = p_room_id;
  end if;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, payload)
  values (p_room_id, p_request_id, 'ready_changed', v_user_id, v_side, jsonb_build_object('ready', p_ready));
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

create function public.auction_cancel(p_room_id uuid, p_request_id uuid)
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
  if v_room.status not in ('waiting', 'countdown', 'active') then perform public._auction_fail('AUCTION_ROOM_TERMINAL'); end if;
  perform public._auction_set_terminal_locked(p_room_id, 'cancelled');
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side)
  values (p_room_id, p_request_id, 'cancelled', v_user_id, 'A');
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

create function public.auction_bid(p_room_id uuid, p_request_id uuid, p_amount integer)
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
  v_acquired integer;
  v_other_budget integer;
  v_other_acquired integer;
  v_max integer;
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
  select count(*) into v_acquired from public.auction_players
  where room_id = p_room_id and assigned_side = v_side and not is_captain;
  v_max := v_budget - (3 - v_acquired);
  if p_amount > v_max then perform public._auction_fail('AUCTION_BUDGET_RESERVE'); end if;
  update public.auction_rooms
  set phase = 'bidding', current_bid = p_amount, leading_side = v_side,
      bid_deadline = clock_timestamp() + make_interval(secs => bid_seconds),
      updated_at = clock_timestamp(), last_activity_at = clock_timestamp(), state_version = state_version + 1
  where id = p_room_id;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id, amount)
  values (p_room_id, p_request_id, 'bid', v_user_id, v_side, v_room.current_player_id, p_amount);

  v_other_side := case v_side when 'A' then 'B' else 'A' end;
  select budget_remaining into v_other_budget from public.auction_captains
  where room_id = p_room_id and side = v_other_side;
  select count(*) into v_other_acquired from public.auction_players
  where room_id = p_room_id and assigned_side = v_other_side and not is_captain;
  v_other_max := v_other_budget - (3 - v_other_acquired);
  if v_other_max < p_amount + 1 then
    perform public._auction_sell_locked(p_room_id, 'opponent_cannot_raise');
  end if;
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

create function public.auction_pass(p_room_id uuid, p_request_id uuid)
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
  if v_room.status <> 'active' or v_room.phase <> 'bidding' then perform public._auction_fail('AUCTION_PASS_NOT_ALLOWED'); end if;
  if clock_timestamp() >= v_room.bid_deadline then perform public._auction_fail('AUCTION_DEADLINE_PASSED'); end if;
  select side into v_side from public.auction_captains where room_id = p_room_id and user_id = v_user_id;
  if v_side is null then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;
  if v_side = v_room.leading_side then perform public._auction_fail('AUCTION_LEADER_CANNOT_PASS'); end if;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id)
  values (p_room_id, p_request_id, 'pass', v_user_id, v_side, v_room.current_player_id);
  update public.auction_rooms set last_activity_at = clock_timestamp(), updated_at = clock_timestamp(), state_version = state_version + 1
  where id = p_room_id;
  perform public._auction_sell_locked(p_room_id, 'pass');
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

create function public.auction_tick()
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
       or (status = 'active' and phase = 'sold_pause' and phase_deadline <= v_now)
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
    elsif v_room.status = 'active' and v_room.phase = 'bidding' and v_room.bid_deadline <= v_now then
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

create function public._auction_broadcast_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
begin
  if tg_table_name = 'auction_rooms' then
    v_room_id := case when tg_op = 'DELETE' then old.id else new.id end;
  else
    v_room_id := case when tg_op = 'DELETE' then old.room_id else new.room_id end;
  end if;
  perform realtime.send(jsonb_build_object('roomId', v_room_id), 'changed', 'auction:room:' || v_room_id::text, true);
  if tg_table_name = 'auction_rooms' then
    perform realtime.send('{}'::jsonb, 'changed', 'auction:list', true);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger auction_rooms_broadcast after insert or update or delete on public.auction_rooms
for each row execute function public._auction_broadcast_change();
create trigger auction_players_broadcast after insert or update or delete on public.auction_players
for each row execute function public._auction_broadcast_change();
create trigger auction_captains_broadcast after insert or update or delete on public.auction_captains
for each row execute function public._auction_broadcast_change();
create trigger auction_events_broadcast after insert or update or delete on public.auction_events
for each row execute function public._auction_broadcast_change();

create policy "auction broadcasts are publicly readable"
on realtime.messages
for select
to anon, authenticated
using (
  realtime.topic() = 'auction:list'
  or realtime.topic() like 'auction:room:%'
);

revoke execute on function public._auction_fail(text) from public, anon, authenticated, service_role;
revoke execute on function public._auction_actor_id() from public, anon, authenticated, service_role;
revoke execute on function public._auction_request_room(uuid, uuid) from public, anon, authenticated, service_role;
revoke execute on function public._auction_snapshot(uuid, uuid) from public, anon, authenticated, service_role;
revoke execute on function public._auction_set_terminal_locked(uuid, text) from public, anon, authenticated, service_role;
revoke execute on function public._auction_reveal_next_locked(uuid) from public, anon, authenticated, service_role;
revoke execute on function public._auction_start_locked(uuid) from public, anon, authenticated, service_role;
revoke execute on function public._auction_sell_locked(uuid, text) from public, anon, authenticated, service_role;
revoke execute on function public._auction_broadcast_change() from public, anon, authenticated, service_role;

revoke execute on function public.auction_get_room(uuid) from public, anon, authenticated, service_role;
revoke execute on function public.auction_list_active() from public, anon, authenticated, service_role;
revoke execute on function public.auction_create_room(uuid, jsonb, text, text, integer, integer, boolean) from public, anon, authenticated, service_role;
revoke execute on function public.auction_join_captain(uuid, uuid, uuid, text) from public, anon, authenticated, service_role;
revoke execute on function public.auction_leave_captain(uuid, uuid) from public, anon, authenticated, service_role;
revoke execute on function public.auction_remove_captain(uuid, uuid) from public, anon, authenticated, service_role;
revoke execute on function public.auction_update_lobby(uuid, uuid, integer, integer, boolean, jsonb, text) from public, anon, authenticated, service_role;
revoke execute on function public.auction_set_ready(uuid, uuid, boolean) from public, anon, authenticated, service_role;
revoke execute on function public.auction_cancel(uuid, uuid) from public, anon, authenticated, service_role;
revoke execute on function public.auction_bid(uuid, uuid, integer) from public, anon, authenticated, service_role;
revoke execute on function public.auction_pass(uuid, uuid) from public, anon, authenticated, service_role;
revoke execute on function public.auction_tick() from public, anon, authenticated, service_role;

grant execute on function public.auction_get_room(uuid) to anon, authenticated, service_role;
grant execute on function public.auction_list_active() to anon, authenticated, service_role;
grant execute on function public.auction_create_room(uuid, jsonb, text, text, integer, integer, boolean) to authenticated, service_role;
grant execute on function public.auction_join_captain(uuid, uuid, uuid, text) to authenticated, service_role;
grant execute on function public.auction_leave_captain(uuid, uuid) to authenticated, service_role;
grant execute on function public.auction_remove_captain(uuid, uuid) to authenticated, service_role;
grant execute on function public.auction_update_lobby(uuid, uuid, integer, integer, boolean, jsonb, text) to authenticated, service_role;
grant execute on function public.auction_set_ready(uuid, uuid, boolean) to authenticated, service_role;
grant execute on function public.auction_cancel(uuid, uuid) to authenticated, service_role;
grant execute on function public.auction_bid(uuid, uuid, integer) to authenticated, service_role;
grant execute on function public.auction_pass(uuid, uuid) to authenticated, service_role;
grant execute on function public.auction_tick() to service_role;

do $$
declare
  v_job record;
begin
  for v_job in select jobid from cron.job where jobname = 'auction-tick-every-second'
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;
  perform cron.schedule('auction-tick-every-second', '1 second', 'select public.auction_tick()');
end;
$$;
