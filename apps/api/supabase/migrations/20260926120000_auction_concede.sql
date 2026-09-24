-- Pass and Concede are different moves, so they are different commands:
--   * auction_concede: while bidding, the non-leader gives the player to the leader at their bid,
--   * auction_pass: in a free auction, the captain with money hands the player to the broke captain
--     for $0.
-- The public list also says which side the viewer captains, so a captain B is not told that creating
-- an auction cancels a lobby they merely joined.

create function public.auction_concede(p_room_id uuid, p_request_id uuid)
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
  if v_room.status <> 'active' or v_room.phase <> 'bidding' then
    perform public._auction_fail('AUCTION_CONCEDE_NOT_ALLOWED');
  end if;
  if clock_timestamp() >= v_room.bid_deadline then
    perform public._auction_fail('AUCTION_DEADLINE_PASSED');
  end if;
  select side into v_side from public.auction_captains where room_id = p_room_id and user_id = v_user_id;
  if v_side is null then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;
  if v_side = v_room.leading_side then perform public._auction_fail('AUCTION_LEADER_CANNOT_CONCEDE'); end if;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id)
  values (p_room_id, p_request_id, 'concede', v_user_id, v_side, v_room.current_player_id);
  perform public._auction_sell_locked(p_room_id, 'concede');
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

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
  if v_room.status <> 'active' or v_room.phase <> 'free_auction' then
    perform public._auction_fail('AUCTION_PASS_NOT_ALLOWED');
  end if;
  if clock_timestamp() >= v_room.phase_deadline then
    perform public._auction_fail('AUCTION_DEADLINE_PASSED');
  end if;
  select side into v_side from public.auction_captains where room_id = p_room_id and user_id = v_user_id;
  if v_side is null then perform public._auction_fail('AUCTION_PERMISSION_DENIED'); end if;
  if v_side <> v_room.leading_side then perform public._auction_fail('AUCTION_PASS_NOT_ALLOWED'); end if;
  insert into public.auction_events(room_id, request_id, event_type, actor_user_id, actor_side, player_id)
  values (p_room_id, p_request_id, 'pass', v_user_id, v_side, v_room.current_player_id);
  perform public._auction_award_locked(
    p_room_id, case v_side when 'A' then 'B' else 'A' end, 0, 'pass'
  );
  return public._auction_snapshot(p_room_id, v_user_id);
end;
$$;

revoke execute on function public.auction_concede(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.auction_concede(uuid, uuid) to authenticated, service_role;

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
    'mySide', case when a.user_id = auth.uid() then 'A' when b.user_id = auth.uid() then 'B' end,
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
