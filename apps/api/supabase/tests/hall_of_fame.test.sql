begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

insert into public.players (puuid, game_name, tag_line)
select 'hof-p' || n, 'HofTest' || n, 'EUW'
from generate_series(1, 5) n;

-- Aggregates are inserted directly: the function only reads ratings and rating history. Tracks 91 and
-- 92 keep the fixtures apart from any real data in the database.
insert into public.ratings
  (ladder_season_id, puuid, rating, wins, losses, avg_kills, avg_op_score, mvp_games, best_streak, lose_streak)
values
  (91, 'hof-p1', 1100, 6, 2, 9.0, 3.2, 3, 4, 0),
  (91, 'hof-p2',  990, 3, 3, 9.0, null, 0, 2, 2),
  (91, 'hof-p3',  900, 1, 5, 2.0, 5.0, 0, 1, 1),
  -- still qualifying: four matches
  (91, 'hof-p4', 1300, 2, 2, 20.0, 9.9, 0, 2, 0),
  -- only on the other track
  (92, 'hof-p5', 1050, 5, 0, 50.0, 1.0, 0, 5, 0);

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

create function tests.hof(p_track integer, p_title text, p_rank integer)
returns text
language sql
stable
as $$
  select string_agg(puuid || '=' || value::text, ',' order by puuid)
  from public.hall_of_fame(p_track)
  where title = p_title and rank = p_rank;
$$;

select plan(13);

select is(
  tests.hof(91, 'most_kills', 1),
  'hof-p1=9.0,hof-p2=9.0',
  'players tied on the best value share the title'
);
select is(
  tests.hof(91, 'most_kills', 2),
  'hof-p3=2.0',
  'the runner-up is the next distinct value'
);
select is(
  tests.hof(91, 'pacifist', 1),
  'hof-p3=2.0',
  'worst titles rank the lowest value first'
);
select ok(
  not exists (select 1 from public.hall_of_fame(91) where puuid in ('hof-p4', 'hof-p5')),
  'only players qualified on the track can hold or chase a title'
);
select is(
  tests.hof(91, 'tilted', 1),
  'hof-p1=4',
  'tilted is the longest losing streak on the track, not the current one'
);
select is(
  tests.hof(91, 'best_streak', 1),
  'hof-p1=4',
  'best streak is the longest win streak'
);
select is(
  tests.hof(91, 'never_mvp', 1),
  'hof-p2=6,hof-p3=6',
  'never MVP ranks players without an MVP by matches played'
);
select is(
  tests.hof(91, 'best_win_rate', 1),
  'hof-p1=0.75000000000000000000',
  'best win rate is wins over matches played'
);
select is(
  tests.hof(91, 'worst_win_rate', 1),
  'hof-p3=0.16666666666666666667',
  'worst win rate is the lowest share of wins'
);
select is(
  tests.hof(91, 'op_score', 1),
  'hof-p3=5.0',
  'a missing value never holds a title'
);
select is(
  tests.hof(92, 'most_kills', 1),
  'hof-p5=50.0',
  'each rating track has its own titles'
);
select is(
  (select max(rank) from public.hall_of_fame(91)),
  2,
  'only holders and runners-up are returned'
);
select ok(
  not exists (
    select 1 from public.hall_of_fame(91)
    where title in ('big_spender', 'hoarder', 'cold', 'veteran_of_defeat', 'triple_threat')
  ),
  'retired titles are gone'
);

select * from finish();
rollback;
