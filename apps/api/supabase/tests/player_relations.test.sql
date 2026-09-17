begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

-- OP scores are irrelevant here; without them ratings move on win/loss only.
alter table public.match_participants disable trigger trg_compute_op_scores;

insert into public.players (puuid, game_name, tag_line)
select 'rel-p' || lpad(n::text, 2, '0'), 'RelTest' || n, 'EUW'
from generate_series(1, 12) n;

-- Participant ids follow roster order: the first five are side 100, the last five side 200.
create function tests.seed_rel_match(
  p_match_id bigint,
  p_game_creation timestamptz,
  p_roster integer[],
  p_side_100_wins boolean
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
    'rel-p' || lpad(p_roster[n]::text, 2, '0'),
    n,
    case when n <= 5 then 100 else 200 end,
    1, 1, 1,
    case when n <= 5 then p_side_100_wins else not p_side_100_wins end
  from generate_series(1, 10) n;
end;
$$;

create function tests.relation(p_puuid text, p_track integer, p_relation text)
returns table (other_puuid text, matches integer, wins integer, losses integer, kills integer)
language sql
stable
as $$
  select other_puuid, matches, wins, losses, kills
  from public.player_relations(p_puuid, p_track)
  where relation = p_relation;
$$;

-- Season 1. Player 01 plays all seven matches; 11 and 12 play once or twice and never qualify.
select tests.seed_rel_match(9920000001, '2020-02-01T12:00:00Z', array[1,2,3,4,5, 6,7,8,9,10], true);
select tests.seed_rel_match(9920000002, '2020-02-02T12:00:00Z', array[1,2,3,4,5, 6,7,8,9,10], true);
select tests.seed_rel_match(9920000003, '2020-02-03T12:00:00Z', array[1,2,3,4,6, 5,11,8,9,10], true);
select tests.seed_rel_match(9920000004, '2020-02-04T12:00:00Z', array[1,2,3,6,7, 4,5,8,9,10], false);
select tests.seed_rel_match(9920000005, '2020-02-05T12:00:00Z', array[1,2,6,7,8, 3,4,5,9,10], false);
select tests.seed_rel_match(9920000006, '2020-02-06T12:00:00Z', array[1,6,7,8,9, 2,3,4,5,10], true);
select tests.seed_rel_match(9920000007, '2020-02-07T12:00:00Z', array[1,6,7,8,11, 2,3,4,5,12], false);

insert into public.match_kills (match_id, killer_participant_id, victim_participant_id) values
  (9920000001, 1, 6), (9920000001, 1, 6),                       -- 01 kills 06 twice
  (9920000002, 7, 1), (9920000002, 7, 1), (9920000002, 7, 1),   -- 07 kills 01 three times
  (9920000007, 1, 10), (9920000007, 1, 10), (9920000007, 1, 10),
  (9920000007, 1, 10), (9920000007, 1, 10);                     -- 01 kills unqualified 12 five times

-- Season 2: one match, so nobody is qualified on that track yet.
select tests.seed_rel_match(9920000008, now(), array[1,2,3,4,5, 6,7,8,9,10], true);

select plan(12);

-- Teammates ------------------------------------------------------------------------

select is(
  (select other_puuid || ' ' || matches from tests.relation('rel-p01', 1, 'most_matches_with')),
  'rel-p02 5',
  'most matches together breaks a tie on wins (02 and 06 both have 5)'
);
select is(
  (select other_puuid || ' ' || wins || '-' || losses from tests.relation('rel-p01', 1, 'most_wins_with')),
  'rel-p04 3-0',
  'most wins together prefers fewer matches on a tie (02, 03 and 04 all have 3 wins)'
);
select is(
  (select other_puuid || ' ' || wins || '-' || losses from tests.relation('rel-p01', 1, 'most_losses_with')),
  'rel-p07 1-3',
  'most losses together prefers fewer matches on a tie (06 and 07 both have 3 losses)'
);

-- Rivals ---------------------------------------------------------------------------

select is(
  (select other_puuid || ' ' || wins || '-' || losses from tests.relation('rel-p01', 1, 'best_head_to_head')),
  'rel-p08 3-1',
  'best head-to-head record ignores rivals met fewer than three times (06 and 07 are 2-0)'
);
select is(
  (select other_puuid || ' ' || wins || '-' || losses from tests.relation('rel-p01', 1, 'worst_head_to_head')),
  'rel-p04 1-3',
  'worst head-to-head record is the lowest win rate among rivals met at least three times'
);
select is(
  (select other_puuid || ' ' || kills from tests.relation('rel-p01', 1, 'most_killed')),
  'rel-p06 2',
  'most killed rival skips players who are not qualified (12 was killed five times)'
);
select is(
  (select other_puuid || ' ' || kills from tests.relation('rel-p01', 1, 'most_killed_by')),
  'rel-p07 3',
  'most killed by names the rival with the most kills on the player'
);

-- Qualification and tracks ---------------------------------------------------------

select ok(
  not exists (
    select 1 from public.player_relations('rel-p01', 1)
    where other_puuid in ('rel-p11', 'rel-p12')
  ),
  'players who are still qualifying never appear as a teammate or rival'
);
select is(
  (select count(*)::integer from public.player_relations('rel-p01', 2)),
  0,
  'relations on a season track only consider players qualified on that track'
);
select is(
  (select matches from tests.relation('rel-p01', 0, 'most_matches_with')),
  6,
  'the all-time track counts matches from every season'
);
select ok(
  exists (select 1 from public.player_relations('rel-p11', 1)),
  'a player who is still qualifying still sees their own teammates and rivals'
);
select is(
  (select count(*)::integer from public.player_relations('rel-p01', 1)),
  7,
  'one row per relation'
);

select * from finish();
rollback;
