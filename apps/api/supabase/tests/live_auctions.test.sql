begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

create temporary table auction_test_state (
  name text primary key,
  room_id uuid not null
);

create function tests.auction_players(p_count integer default 8)
returns jsonb
language sql
immutable
as $$
  select jsonb_agg(jsonb_build_object(
    'gameName', 'Player' || n,
    'tagLine', 'EUW',
    'rank', jsonb_build_object('soloTier', 'GOLD', 'soloDivision', 'I', 'soloRankLabel', 'Gold I')
  ) order by n)
  from generate_series(1, p_count) n;
$$;

create function tests.login(p_user_id uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claim.sub', p_user_id::text, true);
$$;

create function tests.room(p_name text)
returns uuid
language sql
stable
as $$
  select room_id from auction_test_state where name = p_name;
$$;

-- Signs in as the captain of one side of a room.
create function tests.login_side(p_room_id uuid, p_side text)
returns void
language sql
as $$
  select set_config('request.jwt.claim.sub', (
    select user_id::text from public.auction_captains where room_id = p_room_id and side = p_side
  ), true);
$$;

create function tests.other(p_side text)
returns text
language sql
immutable
as $$
  select case p_side when 'A' then 'B' else 'A' end;
$$;

create function tests.leader(p_room_id uuid)
returns text
language sql
stable
as $$
  select leading_side from public.auction_rooms where id = p_room_id;
$$;

create function tests.first_opener(p_room_id uuid)
returns text
language sql
stable
as $$
  select first_opener_side from public.auction_rooms where id = p_room_id;
$$;

-- Ends the sold pause so the next tick starts the next round.
create function tests.next_round(p_room_id uuid)
returns void
language plpgsql
as $$
begin
  update public.auction_rooms set phase_deadline = clock_timestamp() - interval '1 second'
  where id = p_room_id and phase = 'sold_pause';
  perform public.auction_tick();
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated',
  email, '', clock_timestamp(), '{}'::jsonb, '{}'::jsonb, clock_timestamp(), clock_timestamp()
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'auction-a@example.test'),
  ('10000000-0000-0000-0000-000000000002'::uuid, 'auction-b@example.test'),
  ('10000000-0000-0000-0000-000000000003'::uuid, 'auction-c@example.test'),
  ('10000000-0000-0000-0000-000000000004'::uuid, 'auction-d@example.test')
) users(id, email);

insert into public.user_profiles(id, nickname)
values
  ('10000000-0000-0000-0000-000000000001', 'auction-a'),
  ('10000000-0000-0000-0000-000000000002', 'auction-b'),
  ('10000000-0000-0000-0000-000000000003', 'auction-c'),
  ('10000000-0000-0000-0000-000000000004', 'auction-d');

select plan(93);

select has_table('public', 'auction_rooms', 'auction_rooms exists');
select has_table('public', 'auction_captains', 'auction_captains exists');
select has_table('public', 'auction_players', 'auction_players exists');
select has_table('public', 'auction_events', 'auction_events exists');
select ok((select relrowsecurity from pg_class where oid = 'public.auction_rooms'::regclass), 'rooms use RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.auction_captains'::regclass), 'captains use RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.auction_players'::regclass), 'players use RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.auction_events'::regclass), 'events use RLS');
select ok(not has_table_privilege('anon', 'public.auction_rooms', 'SELECT'), 'anon has no direct room reads');
select ok(not has_table_privilege('authenticated', 'public.auction_rooms', 'INSERT'), 'authenticated has no direct room writes');
select ok(has_function_privilege('anon', 'public.auction_get_room(uuid)', 'EXECUTE'), 'anon can read a room through RPC');
select ok(not has_function_privilege('anon', 'public.auction_bid(uuid,uuid,integer)', 'EXECUTE'), 'anon cannot bid');
select ok(not has_function_privilege('anon', 'public.auction_take(uuid,uuid)', 'EXECUTE'), 'anon cannot take');
select ok(not has_function_privilege('anon', 'public.auction_concede(uuid,uuid)', 'EXECUTE'), 'anon cannot concede');
select ok(
  not has_function_privilege('authenticated', 'public._auction_award_locked(uuid,text,integer,text,uuid,uuid)', 'EXECUTE'),
  'clients cannot award players directly'
);
select ok(not has_function_privilege('authenticated', 'public.auction_tick()', 'EXECUTE'), 'clients cannot invoke the global tick');

-- ---- lobby -----------------------------------------------------------------------------------

select tests.login('10000000-0000-0000-0000-000000000001');
insert into auction_test_state(name, room_id)
select 'hidden', (public.auction_create_room(
  '20000000-0000-0000-0000-000000000001', tests.auction_players(), 'Alpha', 20, 30, false
)->>'id')::uuid;

select is(
  (select count(*) from public.auction_players where room_id = tests.room('hidden')),
  8::bigint,
  'create stores the pool of eight players'
);
select is(
  (select count(*) from public.auction_captains where room_id = tests.room('hidden') and side = 'A'),
  1::bigint,
  'the creator becomes captain A without picking a pool player'
);
select is(
  public.auction_get_room(tests.room('hidden'))->'captains'->0->>'profileNickname',
  'auction-a',
  'captains are shown by their profile nickname'
);
select ok(
  not (public.auction_get_room(tests.room('hidden')) ? 'creatorId'),
  'public snapshot omits creator user id'
);
select is(
  public.auction_create_room(
    '20000000-0000-0000-0000-000000000001', tests.auction_players(), 'Alpha', 20, 30, false
  )->>'id',
  tests.room('hidden')::text,
  'create is idempotent by request id'
);

select tests.login('10000000-0000-0000-0000-000000000003');
select throws_ok(
  $$select public.auction_create_room(
    '20000000-0000-0000-0000-000000000002', tests.auction_players(10), 'Bad', 20, 30, false
  )$$,
  'P0001', 'AUCTION_PLAYERS_INVALID', 'create rejects a pool other than eight players'
);

select tests.login('10000000-0000-0000-0000-000000000002');
select lives_ok(format(
  $$select public.auction_join_captain(%L, '20000000-0000-0000-0000-000000000003', 'Bravo')$$,
  tests.room('hidden')
), 'a second user claims captain B with only a team name');

select tests.login('10000000-0000-0000-0000-000000000003');
select throws_ok(format(
  $$select public.auction_join_captain(%L, '20000000-0000-0000-0000-000000000004', 'Charlie')$$,
  tests.room('hidden')
), 'P0001', 'AUCTION_CAPTAIN_SLOT_TAKEN', 'captain B slot cannot be claimed twice');

insert into auction_test_state(name, room_id)
select 'visible', (public.auction_create_room(
  '20000000-0000-0000-0000-000000000005', tests.auction_players(), 'Charlie', 20, 30, true
)->>'id')::uuid;

select tests.login('10000000-0000-0000-0000-000000000004');
select lives_ok(format(
  $$select public.auction_join_captain(%L, '20000000-0000-0000-0000-000000000007', 'Delta')$$,
  tests.room('visible')
), 'an eligible user can captain another room');

select tests.login('10000000-0000-0000-0000-000000000003');
select throws_ok(format(
  $$select public.auction_update_lobby(%L, '20000000-0000-0000-0000-000000000008', null, null, null, %L::jsonb, null)$$,
  tests.room('visible'), tests.auction_players(9)
), 'P0001', 'AUCTION_PLAYERS_INVALID', 'the lobby pool must stay at eight players');

select tests.login('10000000-0000-0000-0000-000000000001');
select lives_ok(format(
  $$select public.auction_set_ready(%L, '20000000-0000-0000-0000-000000000009', true)$$,
  tests.room('hidden')
), 'captain A can become ready');
select tests.login('10000000-0000-0000-0000-000000000002');
select lives_ok(format(
  $$select public.auction_set_ready(%L, '20000000-0000-0000-0000-000000000010', true)$$,
  tests.room('hidden')
), 'captain B can start countdown');
select is(
  (select status from public.auction_rooms where id = tests.room('hidden')),
  'countdown', 'both ready transitions to countdown'
);
select tests.login('10000000-0000-0000-0000-000000000001');
select lives_ok(format(
  $$select public.auction_set_ready(%L, '20000000-0000-0000-0000-000000000011', false)$$,
  tests.room('hidden')
), 'readiness can be withdrawn during countdown');
select is(
  (select status from public.auction_rooms where id = tests.room('hidden')),
  'waiting', 'withdrawing readiness cancels countdown'
);

select public.auction_set_ready(tests.room('hidden'), '20000000-0000-0000-0000-000000000012', true);
update public.auction_rooms set countdown_ends_at = clock_timestamp() - interval '1 second'
where id = tests.room('hidden');
select cmp_ok(public.auction_tick(), '>=', 1, 'tick processes an elapsed countdown');

-- ---- round 1: forced opening bid, concede ---------------------------------------------------

select is(
  (select status from public.auction_rooms where id = tests.room('hidden')),
  'active', 'elapsed countdown starts auction'
);
select is(
  (select count(*) from public.auction_players where room_id = tests.room('hidden') and draw_position is not null),
  1::bigint, 'hidden mode persists only the revealed draw position'
);
select ok(tests.first_opener(tests.room('hidden')) in ('A', 'B'), 'a random captain opens the first round');
select results_eq(
  format($$select phase, current_bid, leading_side, round_number from public.auction_rooms where id = %L$$, tests.room('hidden')),
  format($$values ('bidding'::text, 1, %L::text, 1::smallint)$$, tests.first_opener(tests.room('hidden'))),
  'round 1 opens with a forced $1 bid for the first opener'
);
select is(
  (select count(*) from public.auction_events where room_id = tests.room('hidden') and event_type = 'opening_bid'),
  1::bigint, 'the opening bid is recorded'
);

select tests.login_side(tests.room('hidden'), tests.leader(tests.room('hidden')));
select throws_ok(format(
  $$select public.auction_bid(%L, '20000000-0000-0000-0000-000000000013', 2)$$,
  tests.room('hidden')
), 'P0001', 'AUCTION_LEADER_CANNOT_BID', 'the leading captain cannot raise their own bid');
select throws_ok(format(
  $$select public.auction_concede(%L, '20000000-0000-0000-0000-000000000014')$$,
  tests.room('hidden')
), 'P0001', 'AUCTION_LEADER_CANNOT_CONCEDE', 'the opener cannot give up their own lead');
select throws_ok(format(
  $$select public.auction_take(%L, '20000000-0000-0000-0000-000000000015')$$,
  tests.room('hidden')
), 'P0001', 'AUCTION_TAKE_NOT_ALLOWED', 'take is only for a free auction');

select tests.login_side(tests.room('hidden'), tests.other(tests.leader(tests.room('hidden'))));
select throws_ok(format(
  $$select public.auction_pass(%L, '20000000-0000-0000-0000-000000000030')$$,
  tests.room('hidden')
), 'P0001', 'AUCTION_PASS_NOT_ALLOWED', 'a pass is only for a free auction, so nobody skips a player');
select lives_ok(format(
  $$select public.auction_concede(%L, '20000000-0000-0000-0000-000000000016')$$,
  tests.room('hidden')
), 'the other captain concedes');
select is(
  (select phase from public.auction_rooms where id = tests.room('hidden')),
  'sold_pause', 'a concession resolves the round'
);
select is(
  (select assigned_side || ':' || purchase_price from public.auction_players
   where id = (select current_player_id from public.auction_rooms where id = tests.room('hidden'))),
  tests.first_opener(tests.room('hidden')) || ':1',
  'the conceded player goes to the leader at the opening bid'
);
select is(
  (select count(*) from public.auction_events where request_id = '20000000-0000-0000-0000-000000000016'),
  1::bigint, 'command request id is recorded once'
);
select lives_ok(format(
  $$select public.auction_concede(%L, '20000000-0000-0000-0000-000000000016')$$,
  tests.room('hidden')
), 'retrying a concession is idempotent');
select is(
  (select count(*) from public.auction_events where event_type = 'sold' and room_id = tests.room('hidden')),
  1::bigint, 'idempotent retry does not duplicate sale'
);

-- ---- round 2: the opener alternates, deadline sells to the leader ---------------------------

select tests.next_round(tests.room('hidden'));
select results_eq(
  format($$select phase, current_bid, leading_side, round_number from public.auction_rooms where id = %L$$, tests.room('hidden')),
  format($$values ('bidding'::text, 1, %L::text, 2::smallint)$$, tests.other(tests.first_opener(tests.room('hidden')))),
  'the other captain opens round 2'
);
select tests.login_side(tests.room('hidden'), tests.first_opener(tests.room('hidden')));
select lives_ok(format(
  $$select public.auction_bid(%L, '20000000-0000-0000-0000-000000000017', 2)$$,
  tests.room('hidden')
), 'the non-leader raises');
select is(tests.leader(tests.room('hidden')), tests.first_opener(tests.room('hidden')), 'a raise takes the lead');
update public.auction_rooms set bid_deadline = clock_timestamp() - interval '1 second'
where id = tests.room('hidden');
select tests.login_side(tests.room('hidden'), tests.other(tests.first_opener(tests.room('hidden'))));
select throws_ok(format(
  $$select public.auction_bid(%L, '20000000-0000-0000-0000-000000000018', 3)$$,
  tests.room('hidden')
), 'P0001', 'AUCTION_DEADLINE_PASSED', 'late bid is rejected by server time');
select cmp_ok(public.auction_tick(), '>=', 1, 'tick resolves an elapsed bid deadline');
select is(
  (select phase from public.auction_rooms where id = tests.room('hidden')),
  'sold_pause', 'the deadline sells to the leader'
);

-- ---- round 3: all-in wins at once when the other captain cannot raise -----------------------

select tests.next_round(tests.room('hidden'));
select tests.login_side(tests.room('hidden'), tests.other(tests.first_opener(tests.room('hidden'))));
select throws_ok(format(
  $$select public.auction_bid(%L, '20000000-0000-0000-0000-000000000019', 99)$$,
  tests.room('hidden')
), 'P0001', 'AUCTION_BUDGET_EXCEEDED', 'a bid above remaining budget is rejected');
update public.auction_captains set budget_remaining = case when side = tests.first_opener(room_id) then 5 else 10 end
where room_id = tests.room('hidden');
select lives_ok(format(
  $$select public.auction_bid(%L, '20000000-0000-0000-0000-000000000020', 10)$$,
  tests.room('hidden')
), 'an all-in bid is accepted');
select is(
  (select phase from public.auction_rooms where id = tests.room('hidden')),
  'sold_pause', 'an unbeatable all-in resolves straight to the sold pause'
);
select is(
  (select budget_remaining from public.auction_captains
   where room_id = tests.room('hidden') and side = tests.other(tests.first_opener(room_id))),
  0, 'the all-in side reaches zero budget'
);

-- ---- round 4: the broke opener is opened for; free auction pass -----------------------------

select tests.next_round(tests.room('hidden'));
select results_eq(
  format($$select phase, current_bid, leading_side, round_number from public.auction_rooms where id = %L$$, tests.room('hidden')),
  format($$values ('free_auction'::text, 1, %L::text, 4::smallint)$$, tests.first_opener(tests.room('hidden'))),
  'a broke opener is opened for, which makes a free auction'
);
select ok(
  (select phase_deadline is not null from public.auction_rooms where id = tests.room('hidden')),
  'a free auction runs on a deadline'
);
select tests.login_side(tests.room('hidden'), tests.other(tests.first_opener(tests.room('hidden'))));
select throws_ok(format(
  $$select public.auction_pass(%L, '20000000-0000-0000-0000-000000000021')$$,
  tests.room('hidden')
), 'P0001', 'AUCTION_PASS_NOT_ALLOWED', 'the broke captain cannot pass');
select throws_ok(format(
  $$select public.auction_concede(%L, '20000000-0000-0000-0000-000000000031')$$,
  tests.room('hidden')
), 'P0001', 'AUCTION_CONCEDE_NOT_ALLOWED', 'there is nothing to concede in a free auction');
select throws_ok(format(
  $$select public.auction_bid(%L, '20000000-0000-0000-0000-000000000022', 1)$$,
  tests.room('hidden')
), 'P0001', 'AUCTION_BIDDING_CLOSED', 'nobody bids in a free auction');
select tests.login_side(tests.room('hidden'), tests.first_opener(tests.room('hidden')));
select lives_ok(format(
  $$select public.auction_pass(%L, '20000000-0000-0000-0000-000000000023')$$,
  tests.room('hidden')
), 'the captain with money passes');
select is(
  (select assigned_side || ':' || purchase_price from public.auction_players
   where id = (select current_player_id from public.auction_rooms where id = tests.room('hidden'))),
  tests.other(tests.first_opener(tests.room('hidden'))) || ':0',
  'a passed player goes to the broke captain for $0'
);
select is(
  (select leading_side from public.auction_rooms where id = tests.room('hidden')),
  null, 'nobody leads after a pass'
);

-- ---- round 5: free auction take -------------------------------------------------------------

select tests.next_round(tests.room('hidden'));
select tests.login_side(tests.room('hidden'), tests.first_opener(tests.room('hidden')));
select lives_ok(format(
  $$select public.auction_take(%L, '20000000-0000-0000-0000-000000000024')$$,
  tests.room('hidden')
), 'the captain with money takes the player');
select lives_ok(format(
  $$select public.auction_take(%L, '20000000-0000-0000-0000-000000000024')$$,
  tests.room('hidden')
), 'retrying a take is idempotent');
select is(
  (select assigned_side || ':' || purchase_price from public.auction_players
   where id = (select current_player_id from public.auction_rooms where id = tests.room('hidden'))),
  tests.first_opener(tests.room('hidden')) || ':1',
  'a taken player costs $1'
);

-- ---- round 6: free auction timeout completes the auction ------------------------------------

select tests.next_round(tests.room('hidden'));
select is(
  (select phase from public.auction_rooms where id = tests.room('hidden')),
  'free_auction', 'the free auction continues while one captain is broke'
);
update public.auction_rooms set phase_deadline = clock_timestamp() - interval '1 second'
where id = tests.room('hidden');
select public.auction_tick();
select is(
  (select status from public.auction_rooms where id = tests.room('hidden')),
  'completed', 'the fourth purchase completes the auction'
);
select is(
  (select count(*) from public.auction_players where room_id = tests.room('hidden') and assigned_side = tests.first_opener(room_id)),
  4::bigint, 'the timed-out free auction went to the captain with money'
);
select is(
  (select count(*) from public.auction_players where room_id = tests.room('hidden') and assigned_side = tests.other(tests.first_opener(room_id))),
  4::bigint, 'the other team is rounded out to four players'
);
select is(
  (select sum(amount) from public.auction_events where room_id = tests.room('hidden') and event_type = 'auto_assigned'),
  0::bigint, 'auto-assigned players cost zero dollars'
);

-- ---- both captains broke: the rest is shared alternately ------------------------------------

select tests.login('10000000-0000-0000-0000-000000000003');
select public.auction_set_ready(tests.room('visible'), '20000000-0000-0000-0000-000000000040', true);
select tests.login('10000000-0000-0000-0000-000000000004');
select public.auction_set_ready(tests.room('visible'), '20000000-0000-0000-0000-000000000041', true);
update public.auction_rooms set countdown_ends_at = clock_timestamp() - interval '1 second'
where id = tests.room('visible');
select public.auction_tick();
select is(
  (select count(*) from public.auction_players where room_id = tests.room('visible') and draw_position is not null),
  8::bigint, 'visible mode stores all eight draw positions at start'
);
select is(
  (select count(*) from public.auction_players where room_id = tests.room('visible') and revealed),
  1::bigint, 'only the current player is revealed at start'
);

-- The first opener already has two players, so it fills up while the rest is shared.
update public.auction_players set assigned_side = tests.first_opener(room_id), purchase_price = 0, revealed = true
where id in (
  select id from public.auction_players
  where room_id = tests.room('visible') and assigned_side is null
    and id <> (select current_player_id from public.auction_rooms where id = tests.room('visible'))
  order by draw_position
  limit 2
);
update public.auction_captains set budget_remaining = case when side = tests.first_opener(room_id) then 1 else 0 end
where room_id = tests.room('visible');
select tests.login_side(tests.room('visible'), tests.other(tests.first_opener(tests.room('visible'))));
select public.auction_concede(tests.room('visible'), '20000000-0000-0000-0000-000000000042');
select tests.next_round(tests.room('visible'));
select is(
  (select status from public.auction_rooms where id = tests.room('visible')),
  'completed', 'with both captains broke the rest of the pool is handed out'
);
select is(
  (select array_agg(actor_side order by id) from public.auction_events
   where room_id = tests.room('visible') and event_type = 'auto_assigned'),
  (select array_agg(s) from unnest(array[
    tests.other(tests.first_opener(tests.room('visible'))), tests.first_opener(tests.room('visible')),
    tests.other(tests.first_opener(tests.room('visible'))), tests.other(tests.first_opener(tests.room('visible'))),
    tests.other(tests.first_opener(tests.room('visible')))
  ]) s),
  'players alternate from the round opener, skipping a full team'
);
select is(
  (select count(*) from public.auction_players
   where room_id = tests.room('visible') and assigned_side = tests.first_opener(room_id)),
  4::bigint, 'the full team stops receiving players'
);
select is(
  (select count(*) from public.auction_list_active()
   where (room->>'id')::uuid in (select room_id from auction_test_state)),
  0::bigint, 'public list excludes completed rooms'
);

-- ---- one lobby per person --------------------------------------------------------------------

select tests.login('10000000-0000-0000-0000-000000000001');
insert into auction_test_state(name, room_id)
select 'lobby1', (public.auction_create_room(
  '20000000-0000-0000-0000-000000000060', tests.auction_players(), 'Alpha', 20, 30, false
)->>'id')::uuid;
select is(
  (select count(*) from public.auction_list_active()
   where room->>'status' = 'waiting' and (room->>'isMine')::boolean),
  1::bigint, 'the list includes lobbies and marks the viewer''s own'
);

select tests.login('10000000-0000-0000-0000-000000000002');
select lives_ok(format(
  $$select public.auction_join_captain(%L, '20000000-0000-0000-0000-000000000061', 'Bravo')$$,
  tests.room('lobby1')
), 'captain B joins a lobby');

select tests.login('10000000-0000-0000-0000-000000000003');
insert into auction_test_state(name, room_id)
select 'lobby2', (public.auction_create_room(
  '20000000-0000-0000-0000-000000000062', tests.auction_players(), 'Charlie', 20, 30, false
)->>'id')::uuid;
select tests.login('10000000-0000-0000-0000-000000000002');
select lives_ok(format(
  $$select public.auction_join_captain(%L, '20000000-0000-0000-0000-000000000063', 'Bravo')$$,
  tests.room('lobby2')
), 'joining another lobby is allowed');
select is(
  (select count(*) from public.auction_captains where room_id = tests.room('lobby1') and side = 'B'),
  0::bigint, 'joining another lobby leaves the first'
);
select is(
  (select status from public.auction_rooms where id = tests.room('lobby1')),
  'waiting', 'the left lobby waits for a new captain'
);

select tests.login('10000000-0000-0000-0000-000000000001');
insert into auction_test_state(name, room_id)
select 'lobby3', (public.auction_create_room(
  '20000000-0000-0000-0000-000000000064', tests.auction_players(), 'Alpha', 20, 30, false
)->>'id')::uuid;
select is(
  (select status from public.auction_rooms where id = tests.room('lobby1')),
  'cancelled', 'creating a new auction cancels the creator''s lobby'
);
select is(
  (select payload->>'reason' from public.auction_events
   where room_id = tests.room('lobby1') and event_type = 'cancelled'),
  'replaced', 'the cancellation says the lobby was replaced'
);

select tests.login('10000000-0000-0000-0000-000000000003');
select public.auction_set_ready(tests.room('lobby2'), '20000000-0000-0000-0000-000000000065', true);
select tests.login('10000000-0000-0000-0000-000000000002');
select public.auction_set_ready(tests.room('lobby2'), '20000000-0000-0000-0000-000000000066', true);
update public.auction_rooms set countdown_ends_at = clock_timestamp() - interval '1 second'
where id = tests.room('lobby2');
select public.auction_tick();
select tests.login('10000000-0000-0000-0000-000000000003');
select throws_ok(
  $$select public.auction_create_room(
    '20000000-0000-0000-0000-000000000067', tests.auction_players(), 'Charlie', 20, 30, false
  )$$,
  'P0001', 'AUCTION_ALREADY_CAPTAIN', 'a live auction blocks creating another'
);
select tests.login('10000000-0000-0000-0000-000000000002');
select throws_ok(format(
  $$select public.auction_join_captain(%L, '20000000-0000-0000-0000-000000000068', 'Bravo')$$,
  tests.room('lobby3')
), 'P0001', 'AUCTION_ALREADY_CAPTAIN', 'a live auction blocks joining another');

update public.auction_rooms set last_activity_at = clock_timestamp() - interval '31 minutes'
where id = tests.room('lobby3');
select public.auction_tick();
select is(
  (select status from public.auction_rooms where id = tests.room('lobby3')),
  'expired', 'an idle lobby expires after 30 minutes'
);

-- ---- cancel and cleanup ---------------------------------------------------------------------

select tests.login('10000000-0000-0000-0000-000000000001');
insert into auction_test_state(name, room_id)
select 'cancelled', (public.auction_create_room(
  '20000000-0000-0000-0000-000000000050', tests.auction_players(), 'Alpha', 20, 30, false
)->>'id')::uuid;
select tests.login('10000000-0000-0000-0000-000000000002');
select throws_ok(format(
  $$select public.auction_cancel(%L, '20000000-0000-0000-0000-000000000051')$$,
  tests.room('cancelled')
), 'P0001', 'AUCTION_PERMISSION_DENIED', 'non-creator cannot cancel');
select tests.login('10000000-0000-0000-0000-000000000001');
select lives_ok(format(
  $$select public.auction_cancel(%L, '20000000-0000-0000-0000-000000000052')$$,
  tests.room('cancelled')
), 'creator can cancel a room');
select is(
  jsonb_array_length(public.auction_get_room(tests.room('cancelled'))->'players'),
  0, 'cancelled snapshot hides the pool'
);
update public.auction_rooms set terminal_at = clock_timestamp() - interval '25 hours'
where id = tests.room('cancelled');
select public.auction_tick();
select is(
  (select count(*) from public.auction_rooms where id = tests.room('cancelled')),
  0::bigint, 'tick removes terminal rooms after 24 hours'
);

select * from finish();
rollback;
