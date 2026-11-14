-- Auctions: the snapshot reports facts, not permissions, and a pool player needs a rank object.
--
-- * What a viewer may do in a room is worked out in one place, `auctionPermissions` in
--   @v1/domain/auction, from the snapshot's facts. `_auction_snapshot` stops computing `canJoin`,
--   `canEditLobby` and `canCancel`; the viewer's side and whether they created the room stay.
--   The functions behind each action still enforce every rule.
-- * `auction_create_room` and `auction_update_lobby` stored `'{}'` for a pool player without a rank
--   object, which the `rank_snapshot` check refuses. Such a pool is now `AUCTION_PLAYERS_INVALID`,
--   like a player without a name or tag.
--
-- Deploy the app first: the version before it requires the three removed fields.

create or replace function public.auction_create_room(p_request_id uuid, p_players jsonb, p_team_name text, p_starting_budget integer, p_bid_seconds integer, p_order_visible boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      or nullif(btrim(v_player->>'tagLine'), '') is null
      or jsonb_typeof(v_player->'rank') is distinct from 'object' then
      perform public._auction_fail('AUCTION_PLAYERS_INVALID');
    end if;
    insert into public.auction_players(room_id, game_name, tag_line, rank_snapshot)
    values (
      v_room_id, btrim(v_player->>'gameName'), btrim(v_player->>'tagLine'),
      v_player->'rank'
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
$function$;

create or replace function public.auction_update_lobby(p_room_id uuid, p_request_id uuid, p_starting_budget integer, p_bid_seconds integer, p_order_visible boolean, p_players jsonb, p_team_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
          or nullif(btrim(v_player->>'tagLine'), '') is null
          or jsonb_typeof(v_player->'rank') is distinct from 'object' then
          perform public._auction_fail('AUCTION_PLAYERS_INVALID');
        end if;
        insert into public.auction_players(room_id, game_name, tag_line, rank_snapshot)
        values (p_room_id, btrim(v_player->>'gameName'), btrim(v_player->>'tagLine'),
          v_player->'rank');
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
$function$;

create or replace function public._auction_snapshot(p_room_id uuid, p_viewer_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      'isCreator', r.creator_id = p_viewer_id
    )
  )
  from public.auction_rooms r
  where r.id = p_room_id;
$function$;
