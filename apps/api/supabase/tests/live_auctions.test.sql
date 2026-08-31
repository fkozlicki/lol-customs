begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

create function tests.auction_players()
returns jsonb
language sql
immutable
as $$
  select jsonb_agg(jsonb_build_object(
    'gameName', 'Player' || n,
    'tagLine', 'EUW',
    'rank', jsonb_build_object('tier', 'GOLD', 'division', 'I', 'lp', n)
  ) order by n)
  from generate_series(1, 10) n;
$$;

create function tests.login(p_user_id uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claim.sub', p_user_id::text, true);
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

create temporary table auction_test_state (
  name text primary key,
  room_id uuid not null
);

select plan(72);

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
select ok(not has_function_privilege('authenticated', 'public.auction_tick()', 'EXECUTE'), 'clients cannot invoke the global tick');

select tests.login('10000000-0000-0000-0000-000000000001');
insert into auction_test_state(name, room_id)
select 'hidden', (public.auction_create_room(
  '20000000-0000-0000-0000-000000000001', tests.auction_players(), 'Player1#EUW',
  'Alpha', 20, 30, false
)->>'id')::uuid;

select is(
  (select count(*) from public.auction_players where room_id = (select room_id from auction_test_state where name = 'hidden')),
  10::bigint,
  'create atomically stores exactly ten players'
);
select is(
  (select count(*) from public.auction_captains where room_id = (select room_id from auction_test_state where name = 'hidden')),
  1::bigint,
  'creator becomes captain A'
);
select ok(
  not (public.auction_get_room((select room_id from auction_test_state where name = 'hidden')) ? 'creatorId'),
  'public snapshot omits creator user id'
);
select is(
  public.auction_create_room(
    '20000000-0000-0000-0000-000000000001', tests.auction_players(), 'Player1#EUW',
    'Alpha', 20, 30, false
  )->>'id',
  (select room_id::text from auction_test_state where name = 'hidden'),
  'create is idempotent by request id'
);

select tests.login('10000000-0000-0000-0000-000000000003');
select throws_ok(
  $$select public.auction_create_room(
    '20000000-0000-0000-0000-000000000002',
    tests.auction_players() || (tests.auction_players()->0),
    'Player1#EUW', 'Bad', 20, 30, false
  )$$,
  'P0001', 'AUCTION_PLAYERS_INVALID', 'create rejects a pool other than ten players'
);

select tests.login('10000000-0000-0000-0000-000000000002');
select lives_ok(format(
  $$select public.auction_join_captain(%L, '20000000-0000-0000-0000-000000000003', %L, 'Bravo')$$,
  (select room_id from auction_test_state where name = 'hidden'),
  (select id from public.auction_players where room_id = (select room_id from auction_test_state where name = 'hidden') and riot_id_normalized = 'player2#euw')
), 'a second user can claim captain B');

select tests.login('10000000-0000-0000-0000-000000000003');
select throws_ok(format(
  $$select public.auction_join_captain(%L, '20000000-0000-0000-0000-000000000004', %L, 'Charlie')$$,
  (select room_id from auction_test_state where name = 'hidden'),
  (select id from public.auction_players where room_id = (select room_id from auction_test_state where name = 'hidden') and riot_id_normalized = 'player3#euw')
), 'P0001', 'AUCTION_CAPTAIN_SLOT_TAKEN', 'captain B slot cannot be claimed twice');

insert into auction_test_state(name, room_id)
select 'visible', (public.auction_create_room(
  '20000000-0000-0000-0000-000000000005', tests.auction_players(), 'Player3#EUW',
  'Charlie', 20, 30, true
)->>'id')::uuid;

select tests.login('10000000-0000-0000-0000-000000000002');
select throws_ok(format(
  $$select public.auction_join_captain(%L, '20000000-0000-0000-0000-000000000006', %L, 'Bravo again')$$,
  (select room_id from auction_test_state where name = 'visible'),
  (select id from public.auction_players where room_id = (select room_id from auction_test_state where name = 'visible') and riot_id_normalized = 'player4#euw')
), 'P0001', 'AUCTION_ALREADY_CAPTAIN', 'one user cannot captain two unfinished rooms');

select tests.login('10000000-0000-0000-0000-000000000004');
select lives_ok(format(
  $$select public.auction_join_captain(%L, '20000000-0000-0000-0000-000000000007', %L, 'Delta')$$,
  (select room_id from auction_test_state where name = 'visible'),
  (select id from public.auction_players where room_id = (select room_id from auction_test_state where name = 'visible') and riot_id_normalized = 'player4#euw')
), 'an eligible user can captain another room');

select tests.login('10000000-0000-0000-0000-000000000001');
select lives_ok(format(
  $$select public.auction_set_ready(%L, '20000000-0000-0000-0000-000000000008', true)$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'captain A can become ready');
select tests.login('10000000-0000-0000-0000-000000000002');
select lives_ok(format(
  $$select public.auction_set_ready(%L, '20000000-0000-0000-0000-000000000009', true)$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'captain B can start countdown');
select is(
  (select status from public.auction_rooms where id = (select room_id from auction_test_state where name = 'hidden')),
  'countdown', 'both ready transitions to countdown'
);
select tests.login('10000000-0000-0000-0000-000000000001');
select lives_ok(format(
  $$select public.auction_set_ready(%L, '20000000-0000-0000-0000-000000000010', false)$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'readiness can be withdrawn during countdown');
select is(
  (select status from public.auction_rooms where id = (select room_id from auction_test_state where name = 'hidden')),
  'waiting', 'withdrawing readiness cancels countdown'
);

select public.auction_set_ready(
  (select room_id from auction_test_state where name = 'hidden'),
  '20000000-0000-0000-0000-000000000011', true
);
update public.auction_rooms set countdown_ends_at = clock_timestamp() - interval '1 second'
where id = (select room_id from auction_test_state where name = 'hidden');
select cmp_ok(public.auction_tick(), '>=', 1, 'tick processes an elapsed countdown');
select is(
  (select status from public.auction_rooms where id = (select room_id from auction_test_state where name = 'hidden')),
  'active', 'elapsed countdown starts auction'
);
select is(
  (select count(*) from public.auction_players where room_id = (select room_id from auction_test_state where name = 'hidden') and draw_position is not null),
  1::bigint, 'hidden mode persists only the revealed draw position'
);

-- ---- revocable opening pass, no budget reserve, all-in, passive $1 rule ----
select tests.login('10000000-0000-0000-0000-000000000002');
select lives_ok(format(
  $$select public.auction_pass(%L, '20000000-0000-0000-0000-000000000012')$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'a captain may pass before the opening bid');
select is(
  (select phase from public.auction_rooms where id = (select room_id from auction_test_state where name = 'hidden')),
  'awaiting_opening_bid', 'a lone opening pass does not advance the phase'
);
select is(
  (select (public.auction_get_room((select room_id from auction_test_state where name = 'hidden'))->'openingPass'->>'b')),
  'true', 'the opening pass is recorded against the passing side'
);
select lives_ok(format(
  $$select public.auction_pass(%L, '20000000-0000-0000-0000-000000000012')$$,
  (select room_id from auction_test_state where name = 'hidden')
), 're-passing before a bid is idempotent');

-- a single opening pass is revoked once the foe opens bidding (no reserve)
select tests.login('10000000-0000-0000-0000-000000000001');
select lives_ok(format(
  $$select public.auction_bid(%L, '20000000-0000-0000-0000-000000000013', 1)$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'the opening bid is accepted without a budget reserve');
select is(
  (select (public.auction_get_room((select room_id from auction_test_state where name = 'hidden'))->'openingPass'->>'a')),
  'false', 'opening passes are cleared once bidding opens'
);

select tests.login('10000000-0000-0000-0000-000000000001');
select throws_ok(format(
  $$select public.auction_pass(%L, '20000000-0000-0000-0000-000000000014')$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'P0001', 'AUCTION_LEADER_CANNOT_PASS', 'leading captain cannot pass');
select tests.login('10000000-0000-0000-0000-000000000002');
select lives_ok(format(
  $$select public.auction_pass(%L, '20000000-0000-0000-0000-000000000015')$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'the non-leading captain can pass to concede the player');
select is(
  (select phase from public.auction_rooms where id = (select room_id from auction_test_state where name = 'hidden')),
  'sold_pause', 'pass atomically resolves the player'
);
select is(
  (select count(*) from public.auction_events where request_id = '20000000-0000-0000-0000-000000000015'),
  1::bigint, 'command request id is recorded once'
);
select lives_ok(format(
  $$select public.auction_pass(%L, '20000000-0000-0000-0000-000000000015')$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'retrying pass is idempotent');
select is(
  (select count(*) from public.auction_events where event_type = 'sold' and room_id = (select room_id from auction_test_state where name = 'hidden')),
  1::bigint, 'idempotent retry does not duplicate sale'
);

-- fast-forward the sold pause and test the 2/2 opening-pass skip
update public.auction_rooms set phase_deadline = clock_timestamp() - interval '1 second'
where id = (select room_id from auction_test_state where name = 'hidden');
select public.auction_tick();
select tests.login('10000000-0000-0000-0000-000000000001');
select lives_ok(format(
  $$select public.auction_pass(%L, '20000000-0000-0000-0000-000000000016')$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'captain A passes on the next player');
select tests.login('10000000-0000-0000-0000-000000000002');
select lives_ok(format(
  $$select public.auction_pass(%L, '20000000-0000-0000-0000-000000000017')$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'a reciprocal pass triggers a 2/2 skip');
select is(
  (select count(*) from public.auction_events where room_id = (select room_id from auction_test_state where name = 'hidden') and event_type = 'pass_skipped'),
  1::bigint, 'the skip is recorded as a pass_skipped event'
);
select is(
  (select phase from public.auction_rooms where id = (select room_id from auction_test_state where name = 'hidden')),
  'awaiting_opening_bid', 'the next player is revealed after a 2/2 skip'
);
select is(
  (select count(*) from public.auction_players
   where room_id = (select room_id from auction_test_state where name = 'hidden')
     and not is_captain and revealed and assigned_side is null),
  1::bigint, 'exactly one unassigned player is revealed after the skip'
);

-- late bid rejected by server time, then tick sells on an elapsed deadline
select tests.login('10000000-0000-0000-0000-000000000001');
select public.auction_bid(
  (select room_id from auction_test_state where name = 'hidden'),
  '20000000-0000-0000-0000-000000000024', 1
);
select is(
  (select phase from public.auction_rooms where id = (select room_id from auction_test_state where name = 'hidden')),
  'bidding', 'an opening bid enters bidding when the foe can counter'
);
update public.auction_rooms set bid_deadline = clock_timestamp() - interval '1 second'
where id = (select room_id from auction_test_state where name = 'hidden');
select tests.login('10000000-0000-0000-0000-000000000002');
select throws_ok(format(
  $$select public.auction_bid(%L, '20000000-0000-0000-0000-000000000025', 2)$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'P0001', 'AUCTION_DEADLINE_PASSED', 'late bid is rejected by server time');
select cmp_ok(public.auction_tick(), '>=', 1, 'tick resolves an elapsed bid deadline');

-- all-in (bidding the whole remaining budget) instantly wins when the foe cannot beat it
update public.auction_rooms set phase_deadline = clock_timestamp() - interval '1 second'
where id = (select room_id from auction_test_state where name = 'hidden');
select public.auction_tick();
select tests.login('10000000-0000-0000-0000-000000000001');
select throws_ok(format(
  $$select public.auction_bid(%L, '20000000-0000-0000-0000-000000000018', 99)$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'P0001', 'AUCTION_BUDGET_EXCEEDED', 'a bid above remaining budget is rejected');
update public.auction_captains set budget_remaining = 5
where room_id = (select room_id from auction_test_state where name = 'hidden') and side = 'B';
select tests.login('10000000-0000-0000-0000-000000000001');
select lives_ok(format(
  $$select public.auction_bid(%L, '20000000-0000-0000-0000-000000000019', 18)$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'an all-in bid wins immediately when the foe cannot raise');
select is(
  (select phase from public.auction_rooms where id = (select room_id from auction_test_state where name = 'hidden')),
  'sold_pause', 'an unbeatable all-in resolves straight to the sold pause'
);
select is(
  (select budget_remaining from public.auction_captains
   where room_id = (select room_id from auction_test_state where name = 'hidden') and side = 'A'),
  0, 'the all-in side reaches zero budget'
);

-- passive $1 rule: with the foe at zero budget, bids are capped at current + $1
update public.auction_rooms set phase_deadline = clock_timestamp() - interval '1 second'
where id = (select room_id from auction_test_state where name = 'hidden');
select public.auction_tick();
select tests.login('10000000-0000-0000-0000-000000000001');
select throws_ok(format(
  $$select public.auction_bid(%L, '20000000-0000-0000-0000-000000000020', 1)$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'P0001', 'AUCTION_BUDGET_EXCEEDED', 'a captain at zero budget cannot bid');
select tests.login('10000000-0000-0000-0000-000000000002');
select throws_ok(format(
  $$select public.auction_bid(%L, '20000000-0000-0000-0000-000000000021', 3)$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'P0001', 'AUCTION_OPPONENT_PASSIVE', 'a foe at zero budget caps the bid at $1 over current');
select lives_ok(format(
  $$select public.auction_bid(%L, '20000000-0000-0000-0000-000000000022', 1)$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'the $1 passive bid is accepted');
select is(
  (select phase from public.auction_rooms where id = (select room_id from auction_test_state where name = 'hidden')),
  'sold_pause', 'the $1 bid wins instantly against a zero-budget foe'
);

-- a lone pass by the money side skips the player when the foe is at zero budget
update public.auction_rooms set phase_deadline = clock_timestamp() - interval '1 second'
where id = (select room_id from auction_test_state where name = 'hidden');
select public.auction_tick();
select tests.login('10000000-0000-0000-0000-000000000002');
select lives_ok(format(
  $$select public.auction_pass(%L, '20000000-0000-0000-0000-000000000023')$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'the money side can pass to send a player to the back of the queue');
select is(
  (select count(*) from public.auction_events where room_id = (select room_id from auction_test_state where name = 'hidden') and event_type = 'pass_skipped'),
  2::bigint, 'the lone money-side pass is recorded as a skip'
);

select tests.login('10000000-0000-0000-0000-000000000003');
select public.auction_set_ready(
  (select room_id from auction_test_state where name = 'visible'),
  '20000000-0000-0000-0000-000000000040', true
);
select tests.login('10000000-0000-0000-0000-000000000004');
select public.auction_set_ready(
  (select room_id from auction_test_state where name = 'visible'),
  '20000000-0000-0000-0000-000000000041', true
);
update public.auction_rooms set countdown_ends_at = clock_timestamp() - interval '1 second'
where id = (select room_id from auction_test_state where name = 'visible');
select public.auction_tick();
select is(
  (select count(*) from public.auction_players where room_id = (select room_id from auction_test_state where name = 'visible') and not is_captain and draw_position is not null),
  8::bigint, 'visible mode stores all eight draw positions at start'
);
select is(
  (select count(*) from public.auction_players where room_id = (select room_id from auction_test_state where name = 'visible') and not is_captain and revealed),
  1::bigint, 'only the current player is revealed at start'
);

with available as (
  select id, row_number() over (order by draw_position) n
  from public.auction_players
  where room_id = (select room_id from auction_test_state where name = 'visible')
    and assigned_side is null
    and id <> (select current_player_id from public.auction_rooms where id = (select room_id from auction_test_state where name = 'visible'))
)
update public.auction_players p
set assigned_side = case when a.n <= 3 then 'A' else 'B' end, purchase_price = 1, revealed = true
from available a
where p.id = a.id and a.n <= 6;
update public.auction_captains set budget_remaining = 17
where room_id = (select room_id from auction_test_state where name = 'visible');
select tests.login('10000000-0000-0000-0000-000000000003');
select public.auction_bid(
  (select room_id from auction_test_state where name = 'visible'),
  '20000000-0000-0000-0000-000000000042', 1
);
select tests.login('10000000-0000-0000-0000-000000000004');
select public.auction_pass(
  (select room_id from auction_test_state where name = 'visible'),
  '20000000-0000-0000-0000-000000000043'
);
select is(
  (select status from public.auction_rooms where id = (select room_id from auction_test_state where name = 'visible')),
  'completed', 'fourth purchase auto-completes the auction'
);
select is(
  (select count(*) from public.auction_players where room_id = (select room_id from auction_test_state where name = 'visible') and assigned_side = 'A'),
  5::bigint, 'team A finishes with captain plus four players'
);
select is(
  (select count(*) from public.auction_players where room_id = (select room_id from auction_test_state where name = 'visible') and assigned_side = 'B'),
  5::bigint, 'team B finishes with captain plus four players'
);
select is(
  (select count(*) from public.auction_events where room_id = (select room_id from auction_test_state where name = 'visible') and event_type = 'auto_assigned'),
  1::bigint, 'remaining player is auto-assigned to round out the losing side'
);
select is(
  (select amount from public.auction_events where room_id = (select room_id from auction_test_state where name = 'visible') and event_type = 'auto_assigned'),
  0, 'auto-assigned players cost zero dollars'
);
select is(
  (select count(*) from public.auction_list_active()),
  1::bigint, 'public list excludes completed rooms'
);

select tests.login('10000000-0000-0000-0000-000000000002');
select throws_ok(format(
  $$select public.auction_cancel(%L, '20000000-0000-0000-0000-000000000044')$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'P0001', 'AUCTION_PERMISSION_DENIED', 'non-creator cannot cancel');
select tests.login('10000000-0000-0000-0000-000000000001');
select lives_ok(format(
  $$select public.auction_cancel(%L, '20000000-0000-0000-0000-000000000045')$$,
  (select room_id from auction_test_state where name = 'hidden')
), 'creator can cancel an active room');
select is(
  jsonb_array_length(public.auction_get_room((select room_id from auction_test_state where name = 'hidden'))->'players'),
  0, 'cancelled snapshot hides rosters'
);
update public.auction_rooms set terminal_at = clock_timestamp() - interval '25 hours'
where id = (select room_id from auction_test_state where name = 'hidden');
select public.auction_tick();
select is(
  (select count(*) from public.auction_rooms where id = (select room_id from auction_test_state where name = 'hidden')),
  0::bigint, 'tick removes terminal rooms after 24 hours'
);

select * from finish();
rollback;
