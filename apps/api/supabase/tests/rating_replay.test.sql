begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

-- OP scores are irrelevant here; without them ratings move on win/loss only.
alter table public.match_participants disable trigger trg_compute_op_scores;

-- Players replay-<group>-p<first>..p<first + 9>; the first five form team 100.
create function tests.seed_replay_match(
  p_match_id bigint,
  p_game_creation timestamptz,
  p_team_100_wins boolean,
  p_group text,
  p_first_player integer default 1
)
returns void
language plpgsql
as $$
begin
  insert into public.players (puuid, game_name, tag_line)
  select 'replay-' || p_group || '-p' || (p_first_player + n - 1), 'Replay' || n, 'EUW'
  from generate_series(1, 10) n
  on conflict do nothing;

  insert into public.matches (match_id, platform_id, game_creation, duration, raw_json)
  values (p_match_id, 'EUN1', p_game_creation, 1800, '{}'::jsonb);

  insert into public.match_participants (match_id, puuid, participant_id, team_id, kills, deaths, assists, win)
  select
    p_match_id,
    'replay-' || p_group || '-p' || (p_first_player + n - 1),
    n,
    case when n <= 5 then 100 else 200 end,
    1, 1, 1,
    case when n <= 5 then p_team_100_wins else not p_team_100_wins end
  from generate_series(1, 10) n;
end;
$$;

-- Everything a track holds for one group, keyed by player so two groups compare directly.
create function tests.replay_state(p_track integer, p_group text)
returns text
language sql
stable
as $$
  select jsonb_object_agg(
    replace(puuid, 'replay-' || p_group || '-', ''),
    jsonb_build_array(rating, wins, losses, win_streak, lose_streak, best_streak)
  )::text
  from public.ratings
  where ladder_season_id = p_track
    and puuid like 'replay-' || p_group || '-p%';
$$;

select plan(13);

-- A match uploaded after one played later ------------------------------------------

select tests.seed_replay_match(9930000002, '2020-03-02T12:00:00Z', true, 'late');
select tests.seed_replay_match(9930000001, '2020-03-01T12:00:00Z', false, 'late');

select tests.seed_replay_match(9930000011, '2020-03-01T12:00:00Z', false, 'order');
select tests.seed_replay_match(9930000012, '2020-03-02T12:00:00Z', true, 'order');

select is(
  tests.replay_state(1, 'late'), tests.replay_state(1, 'order'),
  'a late upload leaves the season track as if the matches came in the order played'
);
select is(
  tests.replay_state(0, 'late'), tests.replay_state(0, 'order'),
  'a late upload leaves the all-time track as if the matches came in the order played'
);
select is(
  (select wins + losses from public.leaderboard_at(now(), 1, 200) where puuid = 'replay-late-p1'), 2,
  'the standings count the late match'
);
select is(
  (select rating from public.leaderboard_at(now(), 1, 200) where puuid = 'replay-late-p1'),
  (select rating from public.ratings where ladder_season_id = 1 and puuid = 'replay-late-p1'),
  'the standings show the current rating'
);
select is(
  (select win_streak from public.ratings where ladder_season_id = 1 and puuid = 'replay-late-p1'), 1,
  'a streak ends at the latest match played, not the latest uploaded'
);
select is(
  (
    select count(*)
    from (
      select wins + losses as played, row_number() over (order by created_at, match_id) as nth
      from public.rating_history
      where ladder_season_id = 1 and puuid = 'replay-late-p1'
    ) snapshots
    where played <> nth
  ),
  0::bigint,
  'rating history runs in the order played'
);

-- Uploaded between two other matches -----------------------------------------------

select tests.seed_replay_match(9930000021, '2020-03-03T12:00:00Z', true, 'middle');
select tests.seed_replay_match(9930000023, '2020-03-05T12:00:00Z', false, 'middle');
select tests.seed_replay_match(9930000022, '2020-03-04T12:00:00Z', true, 'middle');

select tests.seed_replay_match(9930000031, '2020-03-03T12:00:00Z', true, 'middle-order');
select tests.seed_replay_match(9930000032, '2020-03-04T12:00:00Z', true, 'middle-order');
select tests.seed_replay_match(9930000033, '2020-03-05T12:00:00Z', false, 'middle-order');

select is(
  tests.replay_state(1, 'middle'), tests.replay_state(1, 'middle-order'),
  'a match uploaded between two others lands between them'
);

-- Players who were not in the late match --------------------------------------------

select tests.seed_replay_match(9930000042, '2020-03-07T12:00:00Z', true, 'shared', 6);
select tests.seed_replay_match(9930000041, '2020-03-06T12:00:00Z', true, 'shared');

select tests.seed_replay_match(9930000051, '2020-03-06T12:00:00Z', true, 'shared-order');
select tests.seed_replay_match(9930000052, '2020-03-07T12:00:00Z', true, 'shared-order', 6);

select is(
  tests.replay_state(1, 'shared'), tests.replay_state(1, 'shared-order'),
  'a late match reaches players who only met its participants afterwards'
);

-- Uploading a saved match again ------------------------------------------------------

insert into public.match_participants (match_id, puuid, participant_id, team_id, kills, deaths, assists, win)
select match_id, puuid, participant_id, team_id, kills, deaths, assists, win
from public.match_participants
where match_id = 9930000001
on conflict (match_id, puuid) do update set kills = excluded.kills;

select is(
  tests.replay_state(1, 'late'), tests.replay_state(1, 'order'),
  'uploading a saved match again changes nothing'
);

-- Only the tracks the late match reaches are recounted --------------------------------

select tests.seed_replay_match(9930000061, now(), true, 'other-season');

update public.ratings
set rating = 1234
where ladder_season_id = public.ladder_season_for(now())
  and puuid = 'replay-other-season-p1';

select tests.seed_replay_match(9930000062, '2020-03-08T12:00:00Z', false, 'other-season');

select is(
  (
    select rating from public.ratings
    where ladder_season_id = public.ladder_season_for(now())
      and puuid = 'replay-other-season-p1'
  ),
  1234,
  'a late match of one season leaves the other seasons alone'
);

-- Nobody has played since: nothing to recount -----------------------------------------

select tests.seed_replay_match(9930000072, '2020-03-10T12:00:00Z', true, 'bystander');

update public.ratings
set rating = 1234
where ladder_season_id in (0, 1)
  and puuid = 'replay-bystander-p1';

select tests.seed_replay_match(9930000071, '2020-03-09T12:00:00Z', true, 'fresh');

select is(
  (select rating from public.ratings where ladder_season_id = 1 and puuid = 'replay-bystander-p1'),
  1234,
  'a late match whose players have not played since recounts nothing on the season track'
);
select is(
  (select rating from public.ratings where ladder_season_id = 0 and puuid = 'replay-bystander-p1'),
  1234,
  'a late match whose players have not played since recounts nothing on the all-time track'
);
select is(
  (select wins + losses from public.ratings where ladder_season_id = 1 and puuid = 'replay-fresh-p1'),
  1,
  'such a match is still rated'
);

select * from finish();
rollback;
