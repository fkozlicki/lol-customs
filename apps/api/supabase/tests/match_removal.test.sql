begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

-- OP scores are irrelevant here; without them ratings move on win/loss only.
create or replace function public.compute_op_scores_for_match(p_match_id bigint)
returns void language sql as $$ select $$;

-- Players rm-<group>-p<first>..p<first + 9>; the first five form team 100.
create function tests.seed_rm_match(
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
  select 'rm-' || p_group || '-p' || (p_first_player + n - 1), 'Rm' || n, 'EUW'
  from generate_series(1, 10) n
  on conflict do nothing;

  insert into public.matches (match_id, platform_id, game_creation, duration, raw_json)
  values (p_match_id, 'EUN1', p_game_creation, 1800, '{}'::jsonb);

  insert into public.match_participants (match_id, puuid, participant_id, team_id, kills, deaths, assists, win)
  select
    p_match_id,
    'rm-' || p_group || '-p' || (p_first_player + n - 1),
    n,
    case when n <= 5 then 100 else 200 end,
    1, 1, 1,
    case when n <= 5 then p_team_100_wins else not p_team_100_wins end
  from generate_series(1, 10) n;
end;
$$;

create function tests.rm_state(p_track integer, p_group text)
returns text
language sql
stable
as $$
  select jsonb_object_agg(
    replace(puuid, 'rm-' || p_group || '-', ''),
    jsonb_build_array(rating, wins, losses, win_streak, lose_streak, best_streak)
  )::text
  from public.ratings
  where ladder_season_id = p_track
    and puuid like 'rm-' || p_group || '-p%';
$$;

select plan(9);

-- Three matches, the middle one removed, against the same matches without it ---------------

select tests.seed_rm_match(9995000001, '2020-08-01T12:00:00Z', true, 'rm');
select tests.seed_rm_match(9995000002, '2020-08-02T12:00:00Z', false, 'rm');
select tests.seed_rm_match(9995000003, '2020-08-03T12:00:00Z', true, 'rm');

select tests.seed_rm_match(9995000011, '2020-08-01T12:00:00Z', true, 'two');
select tests.seed_rm_match(9995000013, '2020-08-03T12:00:00Z', true, 'two');

select tests.seed_rm_match(9995000021, '2020-08-01T12:00:00Z', true, 'three');
select tests.seed_rm_match(9995000022, '2020-08-02T12:00:00Z', false, 'three');
select tests.seed_rm_match(9995000023, '2020-08-03T12:00:00Z', true, 'three');

delete from public.matches where match_id = 9995000002;

select is(
  tests.rm_state(1, 'rm'), tests.rm_state(1, 'two'),
  'removing a match leaves the season track as if it was never played'
);
select is(
  tests.rm_state(0, 'rm'), tests.rm_state(0, 'two'),
  'removing a match leaves the all-time track as if it was never played'
);
select is(
  (select count(*) from public.rating_history where match_id = 9995000002), 0::bigint,
  'a removed match leaves no rating history'
);

-- A player whose only match is removed -----------------------------------------------------

select tests.seed_rm_match(9995000031, '2020-08-04T12:00:00Z', true, 'solo');
delete from public.matches where match_id = 9995000031;

select is(
  (select count(*) from public.ratings where puuid like 'rm-solo-p%'), 0::bigint,
  'a player whose only match is removed leaves the standings'
);

-- Uploading a removed match again -----------------------------------------------------------

select tests.seed_rm_match(9995000002, '2020-08-02T12:00:00Z', false, 'rm');

select is(
  tests.rm_state(1, 'rm'), tests.rm_state(1, 'three'),
  'a removed match uploaded again counts again'
);

-- Schema ---------------------------------------------------------------------------------------

select is(
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and is_nullable = 'YES'
      and (table_name, column_name) in (
        ('ratings', 'rating'), ('ratings', 'wins'), ('ratings', 'losses'),
        ('ratings', 'best_streak'), ('ratings', 'win_streak'), ('ratings', 'lose_streak'),
        ('rating_history', 'rating_after'), ('rating_history', 'wins'), ('rating_history', 'losses'),
        ('rating_history', 'best_streak'), ('rating_history', 'win_streak'), ('rating_history', 'lose_streak'),
        ('rating_history', 'mvp_games'), ('rating_history', 'ace_games')
      )
  ),
  0::bigint,
  'ratings and their history always hold a rating, a record and streaks'
);
select hasnt_index('public', 'matches', 'idx_matches_patch', 'nothing looks matches up by patch');
select hasnt_index(
  'public', 'match_participants', 'idx_participants_match',
  'participants are looked up by match through the primary key'
);
select has_index(
  'public', 'forum_comments', 'idx_forum_comments_post_created',
  'a post''s comments are read through an index'
);

select * from finish();
rollback;
