begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

alter table public.match_participants disable trigger trg_update_ratings;
alter table public.match_participants disable trigger trg_compute_op_scores;

insert into public.players (puuid, game_name, tag_line)
select 'rank-p' || n, 'RankTest' || n, 'EUW'
from generate_series(1, 3) n;

insert into public.matches (match_id, platform_id, game_creation, duration, raw_json)
values
  (9940000001, 'EUN1', '2020-04-01T12:00:00Z', 1800, '{}'::jsonb),
  (9940000002, 'EUN1', '2020-04-08T12:00:00Z', 1800, '{}'::jsonb);

-- Player 1 climbed between the two matches; player 2 played only the older one and later played
-- a match where the client sent no rank; player 3 never had a rank recorded.
insert into public.match_participants (match_id, puuid, participant_id, team_id, win, rank_tier, rank_division)
values
  (9940000001, 'rank-p1', 1, 100, true, 'SILVER', 'II'),
  (9940000001, 'rank-p2', 2, 100, true, 'GOLD', 'IV'),
  (9940000001, 'rank-p3', 3, 100, true, null, null),
  (9940000002, 'rank-p1', 1, 100, true, 'GOLD', 'I'),
  (9940000002, 'rank-p2', 2, 100, true, null, null),
  (9940000002, 'rank-p3', 3, 100, true, null, null);

select plan(4);

select is(
  (select rank_tier || ' ' || rank_division from public.player_latest_ranks() where puuid = 'rank-p1'),
  'GOLD I',
  'the most recent match with a rank wins'
);
select is(
  (select rank_tier || ' ' || rank_division from public.player_latest_ranks() where puuid = 'rank-p2'),
  'GOLD IV',
  'a later match without a rank does not erase the last known rank'
);
select ok(
  not exists (select 1 from public.player_latest_ranks() where puuid = 'rank-p3'),
  'players who never had a rank recorded are left out'
);
select is(
  (select count(*)::integer from public.player_latest_ranks() where puuid like 'rank-p%'),
  2,
  'one row per player'
);

select * from finish();
rollback;
