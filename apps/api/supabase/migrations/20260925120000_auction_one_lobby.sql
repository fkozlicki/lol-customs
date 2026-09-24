-- One lobby per person.
--
-- A captain who left a lobby stayed its captain until it expired 24 hours later: the lobby was not
-- listed, so there was no way back to cancel it, and every new create or join failed with
-- AUCTION_ALREADY_CAPTAIN. Now:
--   * entering a new lobby (create, or join as captain B) releases the previous one: your own lobby is
--     cancelled, someone else's is left; a started auction still blocks,
--   * the public list includes lobbies and marks the viewer's own auction,
--   * an idle lobby expires after 30 minutes instead of 24 hours.

create function public._auction_release_captain_locked(p_user_id uuid, p_except_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_captain record;
begin
  for v_captain in
    select c.room_id, c.side, r.status
    from public.auction_captains c
    join public.auction_rooms r on r.id = c.room_id
    where c.user_id = p_user_id and c.active_slot
      and c.room_id is distinct from p_except_room_id
    for update of r
  loop
    if v_captain.status = 'active' then
      perform public._auction_fail('AUCTION_ALREADY_CAPTAIN');
    elsif v_captain.side = 'A' then
      perform public._auction_set_terminal_locked(v_captain.room_id, 'cancelled');
      insert into public.auction_events(room_id, event_type, actor_user_id, actor_side, payload)
      values (v_captain.room_id, 'cancelled', p_user_id, 'A', jsonb_build_object('reason', 'replaced'));
    else
      delete from public.auction_captains where room_id = v_captain.room_id and side = 'B';
      update public.auction_captains set ready = false where room_id = v_captain.room_id;
      update public.auction_rooms
      set status = 'waiting', phase = null, countdown_ends_at = null, state_version = state_version + 1,
          updated_at = clock_timestamp(), last_activity_at = clock_timestamp()
      where id = v_captain.room_id;
      insert into public.auction_events(room_id, event_type, actor_user_id, actor_side)
      values (v_captain.room_id, 'captain_left', p_user_id, 'B');
    end if;
  end loop;
end;
$$;

revoke execute on function public._auction_release_captain_locked(uuid, uuid) from public, anon, authenticated, service_role;

drop index public.auction_rooms_public_list_idx;
create index auction_rooms_public_list_idx on public.auction_rooms(status, updated_at desc)
  where status in ('waiting', 'countdown', 'active');

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
    'isMine', coalesce(a.user_id = auth.uid() or b.user_id = auth.uid(), false),
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
  where r.status in ('waiting', 'countdown', 'active')
  order by (coalesce(a.user_id = auth.uid() or b.user_id = auth.uid(), false)) desc,
    r.updated_at desc, r.id;
$$;

create or replace function public.auction_create_room(
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
  perform public._auction_release_captain_locked(v_user_id, null);
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

create or replace function public.auction_join_captain(
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
  perform public._auction_release_captain_locked(v_user_id, p_room_id);
  select * into v_room from public.auction_rooms where id = p_room_id for update;
  if not found then perform public._auction_fail('AUCTION_ROOM_NOT_FOUND'); end if;
  v_seen := public._auction_request_room(p_request_id, v_user_id);
  if v_seen is not null then return public._auction_snapshot(p_room_id, v_user_id); end if;
  if v_room.status <> 'waiting' then perform public._auction_fail('AUCTION_ROOM_NOT_WAITING'); end if;
  if v_room.creator_id = v_user_id then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;
  if exists (select 1 from public.auction_captains where room_id = p_room_id and user_id = v_user_id) then
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
       or (status = 'waiting' and last_activity_at <= v_now - interval '30 minutes')
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
       or (v_room.status = 'waiting' and v_room.last_activity_at <= v_now - interval '30 minutes') then
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
