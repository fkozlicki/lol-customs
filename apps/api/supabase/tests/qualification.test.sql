begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

-- OP scores are irrelevant here; without them ratings move on win/loss only.
alter table public.match_participants disable trigger trg_compute_op_scores;

insert into public.players (puuid, game_name, tag_line)
select 'qual-test-p' || n, 'QualTest' || n, 'EUW'
from generate_series(1, 12) n;

-- Players p<first>..p<first + 9>; the first five form team 100.
create function tests.seed_qual_match(
  p_match_id bigint,
  p_game_creation timestamptz,
  p_team_100_wins boolean,
  p_first_player integer default 1
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
    'qual-test-p' || (p_first_player + n - 1),
    n,
    case when n <= 5 then 100 else 200 end,
    1, 1, 1,
    case when n <= 5 then p_team_100_wins else not p_team_100_wins end
  from generate_series(1, 10) n;
end;
$$;

create function tests.qual_rating(p_track integer, p_puuid text)
returns public.ratings
language sql
stable
as $$
  select * from public.ratings where ladder_season_id = p_track and puuid = p_puuid;
$$;

select plan(16);

-- Qualification threshold -----------------------------------------------------------

select tests.seed_qual_match(9910000001, '2020-01-01T12:00:00Z', true);
select tests.seed_qual_match(9910000002, '2020-01-02T12:00:00Z', false);
select tests.seed_qual_match(9910000003, '2020-01-03T12:00:00Z', true);
select tests.seed_qual_match(9910000004, '2020-01-04T12:00:00Z', true);

select is(
  (tests.qual_rating(1, 'qual-test-p1')).matches_played, 4,
  'matches_played counts wins and losses on the track'
);
select is(
  (tests.qual_rating(1, 'qual-test-p1')).qualified, false,
  'four matches are not enough to qualify'
);

select tests.seed_qual_match(9910000005, '2020-01-05T12:00:00Z', false);

select is(
  (tests.qual_rating(1, 'qual-test-p1')).qualified, true,
  'the fifth match qualifies the player'
);

-- Qualification is per rating track -------------------------------------------------

select tests.seed_qual_match(9910000006, now(), true);
select tests.seed_qual_match(9910000007, now() + interval '1 minute', true);

select is(
  (tests.qual_rating(2, 'qual-test-p1')).qualified, false,
  'Season 1 matches do not qualify a player for Season 2'
);
select is(
  (tests.qual_rating(0, 'qual-test-p1')).qualified, true,
  'all-time qualification counts matches from every season'
);

-- A newcomer with a single win outrates qualified losers ----------------------------

select tests.seed_qual_match(9910000008, '2020-01-06T12:00:00Z', false, 3);

select ok(
  (tests.qual_rating(1, 'qual-test-p11')).rating
    > (tests.qual_rating(1, 'qual-test-p3')).rating,
  'setup: the unqualified newcomer has a higher Season 1 rating than a qualified player'
);

select is(
  (select bool_and(qualified) from public.leaderboard_at('2020-02-01T00:00:00Z', 1, 200)
   where puuid in ('qual-test-p1', 'qual-test-p3')),
  true,
  'leaderboard_at marks qualified players'
);
select is(
  (select qualified from public.leaderboard_at('2020-02-01T00:00:00Z', 1, 200)
   where puuid = 'qual-test-p11'),
  false,
  'leaderboard_at marks players who are still qualifying'
);
select ok(
  (select max(position) filter (where qualified) < min(position) filter (where not qualified)
   from public.leaderboard_at('2020-02-01T00:00:00Z', 1, 200) with ordinality as l(
     puuid, rating, wins, losses, best_streak, win_streak, lose_streak, updated_at,
     avg_kills, avg_deaths, avg_assists, mvp_games, ace_games, game_name, tag_line,
     profile_icon, platform_id, qualified, position
   )),
  'leaderboard_at lists every qualified player before anyone still qualifying'
);
select is(
  (select qualified from public.leaderboard_at('2020-01-04T23:00:00Z', 1, 200)
   where puuid = 'qual-test-p1'),
  false,
  'leaderboard_at judges qualification at the snapshot time'
);

-- Standings position ----------------------------------------------------------------

select is(
  public.standings_position('qual-test-p11', 1),
  null::integer,
  'a player who is still qualifying has no position'
);
select is(
  public.standings_position('qual-test-p1', 1),
  1 + (select count(*)::integer from public.ratings
       where ladder_season_id = 1 and qualified
         and rating > (tests.qual_rating(1, 'qual-test-p1')).rating),
  'position counts only qualified players rated higher'
);

-- Rating change -----------------------------------------------------------------------

select is(
  (select rating_change from public.rating_changes(array[9910000001]::bigint[], 1)
   where puuid = 'qual-test-p1'),
  (select rating_after - 1000 from public.rating_history
   where ladder_season_id = 1 and puuid = 'qual-test-p1' and match_id = 9910000001),
  'the first match changes the rating from 1000'
);
select ok(
  (select rating_change from public.rating_changes(array[9910000002]::bigint[], 1)
   where puuid = 'qual-test-p1') < 0,
  'a lost match has a negative rating change'
);

-- Late upload: dated before matches that were already applied.
select tests.seed_qual_match(9910000009, '2019-12-31T12:00:00Z', false);

select is(
  (select sum(rating_change)::integer from public.rating_changes(
     array(select match_id from public.rating_history
           where ladder_season_id = 1 and puuid = 'qual-test-p1'), 1)
   where puuid = 'qual-test-p1'),
  (tests.qual_rating(1, 'qual-test-p1')).rating - 1000,
  'rating changes add up to the current rating, even with a late upload'
);
select is(
  (select count(*)::integer from public.rating_changes(array[9910000006]::bigint[], 0)),
  10,
  'rating_changes reads the requested track only'
);

select * from finish();
rollback;
