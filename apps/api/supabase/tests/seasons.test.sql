begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

-- OP scores are irrelevant here; without them ratings move on win/loss only.
alter table public.match_participants disable trigger trg_compute_op_scores;

insert into public.players (puuid, game_name, tag_line)
select 'season-test-p' || n, 'SeasonTest' || n, 'EUW'
from generate_series(1, 10) n;

-- Team 100 = p1..p5, team 200 = p6..p10.
create function tests.seed_season_match(
  p_match_id bigint,
  p_game_creation timestamptz,
  p_team_100_wins boolean
)
returns void
language plpgsql
as $$
begin
  insert into public.matches (match_id, platform_id, game_creation, duration, raw_json)
  values (p_match_id, 'EUN1', p_game_creation, 1800, '{}'::jsonb);

  insert into public.match_participants (match_id, puuid, participant_id, team_id, kills, deaths, assists, win)
  select
    p_match_id,
    'season-test-p' || n,
    n,
    case when n <= 5 then 100 else 200 end,
    1, 1, 1,
    case when n <= 5 then p_team_100_wins else not p_team_100_wins end
  from generate_series(1, 10) n;
end;
$$;

create function tests.track_record(p_track integer, p_puuid text)
returns text
language sql
stable
as $$
  select wins || '-' || losses from public.ratings where ladder_season_id = p_track and puuid = p_puuid;
$$;

create function tests.track_rating(p_track integer, p_puuid text)
returns public.ratings
language sql
stable
as $$
  select * from public.ratings where ladder_season_id = p_track and puuid = p_puuid;
$$;

select plan(22);

-- Season assignment -----------------------------------------------------------

select is(
  public.ladder_season_for('2020-01-01T00:00:00Z'), 1,
  'games before Season 2 start belong to Season 1'
);
select is(
  public.ladder_season_for(now()), 2,
  'games from now on belong to Season 2'
);

select tests.seed_season_match(9900000001, '2020-01-01T12:00:00Z', true);

select is(
  (select ladder_season_id from public.matches where match_id = 9900000001), 1,
  'Season 1 game is stamped with ladder_season_id 1'
);

-- Season 1 game -----------------------------------------------------------------

select ok(
  (tests.track_rating(1, 'season-test-p1')).rating > 1000,
  'Season 1 winner gains rating on the Season 1 track'
);
select is(
  (tests.track_rating(0, 'season-test-p1')).rating,
  (tests.track_rating(1, 'season-test-p1')).rating,
  'all-time track mirrors Season 1 after the first game'
);
select ok(
  not exists (select 1 from public.ratings where ladder_season_id = 2 and puuid = 'season-test-p1'),
  'no Season 2 rating before any Season 2 game'
);

-- Season 2 game (hard reset) ----------------------------------------------------

insert into public.matches (match_id, platform_id, game_creation, duration, raw_json, ladder_season_id)
values (9900000002, 'EUN1', now(), 1800, '{}'::jsonb, 1);

select is(
  (select ladder_season_id from public.matches where match_id = 9900000002), 2,
  'client-provided ladder_season_id is ignored in favour of game_creation'
);

insert into public.match_participants (match_id, puuid, participant_id, team_id, kills, deaths, assists, win)
select 9900000002, 'season-test-p' || n, n, case when n <= 5 then 100 else 200 end, 1, 1, 1, n > 5
from generate_series(1, 10) n;

select is(
  (tests.track_rating(2, 'season-test-p1')).rating,
  1000 - 16,
  'Season 2 starts from 1000 (equal teams, loss = -16)'
);
select is(
  tests.track_record(2, 'season-test-p1'),
  '0-1',
  'Season 2 wins/losses start from zero'
);
select is(
  (tests.track_rating(1, 'season-test-p1')).wins, 1,
  'Season 1 track is untouched by a Season 2 game'
);
select is(
  tests.track_record(0, 'season-test-p1'),
  '1-1',
  'all-time track keeps accumulating across seasons'
);
select ok(
  (tests.track_rating(0, 'season-test-p1')).rating
    < (tests.track_rating(1, 'season-test-p1')).rating,
  'all-time rating continues from the Season 1 rating instead of resetting'
);
select is(
  (tests.track_rating(2, 'season-test-p1')).lose_streak, 1,
  'Season 2 streak counts only Season 2 games'
);
select is(
  (tests.track_rating(2, 'season-test-p1')).win_streak, 0,
  'Season 1 wins do not leak into the Season 2 win streak'
);

select is(
  (select array_agg(distinct ladder_season_id order by ladder_season_id)
   from public.rating_history where match_id = 9900000002),
  array[0, 2],
  'Season 2 game writes history to the Season 2 and all-time tracks only'
);
select is(
  (select count(*) from public.rating_history where match_id = 9900000002),
  20::bigint,
  'one history row per participant per track'
);

-- Late Season 1 upload ------------------------------------------------------------

select tests.seed_season_match(9900000003, '2020-01-02T12:00:00Z', true);

select is(
  (select ladder_season_id from public.matches where match_id = 9900000003), 1,
  'late upload of an old game still lands in Season 1'
);
select is(
  (tests.track_rating(1, 'season-test-p1')).wins, 2,
  'late Season 1 game updates the Season 1 track'
);
select is(
  tests.track_record(2, 'season-test-p1'),
  '0-1',
  'late Season 1 game does not touch Season 2'
);
select is(
  (tests.track_rating(0, 'season-test-p1')).wins, 2,
  'late Season 1 game also counts on the all-time track'
);

-- Point-in-time leaderboard per track ----------------------------------------------

select is(
  (select wins || '-' || losses from public.leaderboard_at(now() + interval '1 hour', 2, 200) where puuid = 'season-test-p1'),
  '0-1',
  'leaderboard_at reads the Season 2 track'
);
select is(
  (select wins from public.leaderboard_at('2020-01-01T23:00:00Z', 1, 200) where puuid = 'season-test-p1'),
  1,
  'leaderboard_at on Season 1 respects the snapshot time'
);

select * from finish();
rollback;
