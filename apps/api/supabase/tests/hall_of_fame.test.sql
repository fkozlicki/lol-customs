begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

insert into public.players (puuid, game_name, tag_line)
select 'hof-p' || n, 'HofTest' || n, 'EUW'
from generate_series(1, 5) n;

-- Aggregates are inserted directly: the function only reads ratings and rating history. Tracks 91 and
-- 92 keep the fixtures apart from any real data in the database.
insert into public.ratings
  (ladder_season_id, puuid, rating, wins, losses, avg_kills, avg_deaths, avg_op_score, mvp_games, best_streak, lose_streak, total_triple_kills)
values
  (91, 'hof-p1', 1100, 6, 2, 9.0, 5.0, 3.2, 3, 4, 0, 2),
  (91, 'hof-p2',  990, 3, 3, 9.0, 3.0, null, 0, 2, 2, 1),
  (91, 'hof-p3',  900, 1, 5, 2.0, 8.0, 5.0, 0, 1, 1, 0),
  -- still qualifying: four matches
  (91, 'hof-p4', 1300, 2, 2, 20.0, 0.5, 9.9, 0, 2, 0, 9),
  -- only on the other track
  (92, 'hof-p5', 1050, 5, 0, 50.0, 1.0, 1.0, 0, 5, 0, 0);

insert into public.matches (match_id, platform_id, game_creation, duration, raw_json)
values
  (9930000001, 'EUN1', '2020-03-01T12:00:00Z', 1800, '{}'::jsonb),
  (9930000002, 'EUN1', '2020-03-02T12:00:00Z', 1800, '{}'::jsonb);

-- Player 1 once lost four in a row but is not on a losing streak now.
insert into public.rating_history (ladder_season_id, puuid, match_id, rating_after, wins, losses, lose_streak)
values
  (91, 'hof-p1', 9930000001, 1000, 2, 4, 4),
  (91, 'hof-p1', 9930000002, 1100, 6, 2, 0),
  (91, 'hof-p2', 9930000001, 990, 3, 2, 2),
  (91, 'hof-p2', 9930000002, 990, 3, 3, 2),
  (91, 'hof-p3', 9930000001, 900, 1, 5, 1);

-- Jungle titles read roles from matches. Season 91 starts in 2091 so these matches land on track 91; the
-- rating triggers are off so the aggregates above stay as inserted.
alter table public.match_participants disable trigger trg_update_ratings;
alter table public.match_participants disable trigger trg_compute_op_scores;

insert into public.seasons (id, number, starts_at) values (91, 91, '2091-01-01T00:00:00Z');

insert into public.players (puuid, game_name, tag_line)
select 'hof-f' || n, 'HofFiller' || n, 'EUW'
from generate_series(1, 8) n;

-- Participant 2 and 7 are the junglers of a ten-player Summoner's Rift lobby.
create function tests.seed_jungle_match(
  p_match_id bigint,
  p_day integer,
  p_slots text[],
  p_neutral integer[]
)
returns void
language plpgsql
as $$
begin
  insert into public.matches (match_id, platform_id, game_creation, duration, map_id, raw_json)
  values (p_match_id, 'EUN1', '2091-01-01T12:00:00Z'::timestamptz + make_interval(days => p_day), 1800, 11, '{}'::jsonb);

  insert into public.match_participants (match_id, puuid, participant_id, team_id, win, neutral_minions_killed)
  select p_match_id, p_slots[n], n, case when n <= 5 then 100 else 200 end, n <= 5, p_neutral[n]
  from generate_series(1, 10) n;
end;
$$;

-- p1 and p2 jungle three times. p3 supports with no jungle CS, then jungles only twice. p4 jungles
-- three times but is still qualifying.
select tests.seed_jungle_match(9930000011, 1,
  array['hof-f1','hof-p1','hof-f2','hof-f3','hof-p3','hof-f4','hof-p2','hof-f5','hof-f6','hof-f7'],
  array[0,150,0,0,0, 0,100,0,0,0]);
select tests.seed_jungle_match(9930000012, 2,
  array['hof-f1','hof-p1','hof-f2','hof-f3','hof-p3','hof-f4','hof-p2','hof-f5','hof-f6','hof-f7'],
  array[0,150,0,0,0, 0,100,0,0,0]);
select tests.seed_jungle_match(9930000013, 3,
  array['hof-f1','hof-p1','hof-f2','hof-f3','hof-p3','hof-f4','hof-p2','hof-f5','hof-f6','hof-f7'],
  array[0,150,0,0,0, 0,100,0,0,0]);
select tests.seed_jungle_match(9930000014, 4,
  array['hof-f1','hof-p3','hof-f2','hof-f3','hof-f8','hof-f4','hof-p4','hof-f5','hof-f6','hof-f7'],
  array[0,10,0,0,0, 0,5,0,0,0]);
select tests.seed_jungle_match(9930000015, 5,
  array['hof-f1','hof-p3','hof-f2','hof-f3','hof-f8','hof-f4','hof-p4','hof-f5','hof-f6','hof-f7'],
  array[0,10,0,0,0, 0,5,0,0,0]);
select tests.seed_jungle_match(9930000016, 6,
  array['hof-f1','hof-p1','hof-f2','hof-f3','hof-f8','hof-f4','hof-p4','hof-f5','hof-f6','hof-f7'],
  array[0,150,0,0,0, 0,5,0,0,0]);

create function tests.hof(p_track integer, p_title text)
returns text
language sql
stable
as $$
  select string_agg(puuid || '=' || value::text, ',' order by puuid)
  from public.hall_of_fame(p_track)
  where title = p_title;
$$;

select plan(18);

select is(
  tests.hof(91, 'most_kills'),
  'hof-p1=9.0,hof-p2=9.0',
  'players tied on the best value share the title, and only holders are returned'
);
select is(
  tests.hof(91, 'pacifist'),
  'hof-p3=2.0',
  'worst titles rank the lowest value first'
);
select ok(
  not exists (select 1 from public.hall_of_fame(91) where puuid in ('hof-p4', 'hof-p5')),
  'only players qualified on the track can hold or chase a title'
);
select is(
  tests.hof(91, 'tilted'),
  'hof-p1=4',
  'tilted is the longest losing streak on the track, not the current one'
);
select is(
  tests.hof(91, 'best_streak'),
  'hof-p1=4',
  'best streak is the longest win streak'
);
select is(
  tests.hof(91, 'never_mvp'),
  'hof-p2=6,hof-p3=6',
  'never MVP ranks players without an MVP by matches played'
);
select is(
  tests.hof(91, 'best_win_rate'),
  'hof-p1=0.75000000000000000000',
  'best win rate is wins over matches played'
);
select is(
  tests.hof(91, 'worst_win_rate'),
  'hof-p3=0.16666666666666666667',
  'worst win rate is the lowest share of wins'
);
select is(
  tests.hof(91, 'op_score'),
  'hof-p3=5.0',
  'a missing value never holds a title'
);
select is(
  tests.hof(92, 'most_kills'),
  'hof-p5=50.0',
  'each rating track has its own titles'
);
select is(
  tests.hof(91, 'fewest_deaths'),
  'hof-p2=3.0',
  'fewest deaths is the lowest deaths per match'
);
select is(
  tests.hof(91, 'cannon_fodder'),
  'hof-p3=8.0',
  'cannon fodder is the highest deaths per match'
);
select is(
  tests.hof(91, 'worst_op_score'),
  'hof-p1=3.2',
  'worst OP score is the lowest average OP score'
);
select is(
  (select string_agg(puuid || '=' || round(value, 1), ',') from public.hall_of_fame(91) where title = 'jungle_clearer'),
  'hof-p1=150.0',
  'jungle clearer averages jungle CS over matches played as jungler'
);
select is(
  (select string_agg(puuid || '=' || round(value, 1), ',') from public.hall_of_fame(91) where title = 'jungle_tourist'),
  'hof-p2=100.0',
  'jungle tourist ignores supports and players with fewer than three jungle matches'
);
select is(
  tests.hof(91, 'triple_threat'),
  'hof-p1=2',
  'triple threat is the most triple kills'
);
select is(
  tests.hof(91, 'quadra_killer'),
  null,
  'nobody holds a counting title when every value is zero'
);
select ok(
  not exists (
    select 1 from public.hall_of_fame(91)
    where title in ('big_spender', 'hoarder', 'cold', 'veteran_of_defeat', 'bottom_of_ladder', 'tank')
  ),
  'retired titles are gone'
);

select * from finish();
rollback;
