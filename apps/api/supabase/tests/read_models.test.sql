begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

-- OP scores are irrelevant here; without them ratings move on win/loss only.
create or replace function public.compute_op_scores_for_match(p_match_id bigint)
returns void language sql as $$ select $$;

-- Riot ID lookups ---------------------------------------------------------------------------------

-- 'rm-old' and 'rm-new' carry the same Riot ID: 'rm-new' took it after 'rm-old' renamed, and the
-- old row keeps the name until its owner plays again. 'rm-under' has a name with a `_` in it.
insert into public.players (puuid, game_name, tag_line, last_seen_at) values
  ('rm-old', 'Taken Name', 'EUW', '2020-01-01T00:00:00Z'),
  ('rm-new', 'taken name', 'euw', '2020-06-01T00:00:00Z'),
  ('rm-under', 'Under_Score', 'EUW', '2020-06-01T00:00:00Z');

insert into public.matches (match_id, platform_id, game_creation, duration, raw_json)
values (9950000001, 'EUN1', '2026-10-05T12:00:00Z', 1800, '{}'::jsonb);
alter table public.match_participants disable trigger trg_rate_uploaded_matches;
insert into public.match_participants (match_id, puuid, participant_id, team_id, win, rank_tier, rank_division)
values
  (9950000001, 'rm-old', 1, 100, true, 'IRON', 'IV'),
  (9950000001, 'rm-new', 2, 100, true, 'GOLD', 'II');
alter table public.match_participants enable trigger trg_rate_uploaded_matches;

-- Champions and standings: ten players, three matches -----------------------------------------------

insert into public.players (puuid, game_name, tag_line)
select 'rm-p' || n, 'ReadModel' || n, 'EUW'
from generate_series(1, 10) n;

-- Players 1–5 are team 100. Player 1 plays p_champion; everyone else plays champion 900 + n.
create function tests.seed_rm_match(
  p_match_id bigint,
  p_game_creation timestamptz,
  p_team_100_wins boolean,
  p_champion integer
)
returns void
language plpgsql
as $$
begin
  insert into public.matches (match_id, platform_id, game_creation, duration, raw_json)
  values (p_match_id, 'EUN1', p_game_creation, 1800, '{}'::jsonb);

  insert into public.teams (match_id, team_id, win)
  values (p_match_id, 100, p_team_100_wins), (p_match_id, 200, not p_team_100_wins);

  insert into public.match_participants (
    match_id, puuid, participant_id, team_id, champion_id, kills, deaths, assists, win
  )
  select
    p_match_id,
    'rm-p' || n,
    n,
    case when n <= 5 then 100 else 200 end,
    case when n = 1 then p_champion else 900 + n end,
    n, 1, 2,
    case when n <= 5 then p_team_100_wins else not p_team_100_wins end
  from generate_series(1, 10) n;
end;
$$;

-- Season 1 (2020): champion 30 won once and lost once, champion 20 lost once.
select tests.seed_rm_match(9950000011, '2020-07-01T12:00:00Z', true, 30);
select tests.seed_rm_match(9950000012, '2020-07-02T12:00:00Z', false, 30);
select tests.seed_rm_match(9950000013, '2020-07-03T12:00:00Z', false, 20);
-- Season 2 (from September 2026): champion 10, won.
select tests.seed_rm_match(9950000014, '2026-10-01T12:00:00Z', true, 10);

-- Each match rated as if uploaded an hour after it was played, at a time with microseconds.
update public.rating_history rh
set created_at = m.game_creation + interval '1 hour 0.000123 second'
from public.matches m
where m.match_id = rh.match_id and m.match_id between 9950000011 and 9950000014;

-- Forum ---------------------------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000', ('40000000-0000-0000-0000-00000000000' || n)::uuid,
  'authenticated', 'authenticated', 'read-model-' || n || '@example.test', '', now(), '{}', '{}',
  now(), now()
from generate_series(1, 3) n;
insert into public.user_profiles (id, nickname)
select ('40000000-0000-0000-0000-00000000000' || n)::uuid, 'read-model-' || n
from generate_series(1, 3) n;

insert into public.forum_posts (id, author_id, title, content) values
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Busy', '{}'),
  ('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Quiet', '{}');
insert into public.forum_reactions (post_id, user_id, type) values
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'like'),
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'like'),
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 'dislike');
insert into public.forum_comments (post_id, author_id, content) values
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '{}');

select plan(11);

-- Riot ID lookups ---------------------------------------------------------------------------------

select is(
  (select puuid from public.player_by_riot_id('  UNDER_score ', 'euw ')),
  'rm-under',
  'a Riot ID is found whatever its case and surrounding spaces'
);
select is(
  (select count(*)::integer from public.player_by_riot_id('Under%', 'EUW'))
    + (select count(*)::integer from public.player_by_riot_id('UnderXScore', 'EUW')),
  0,
  'a % or _ in a Riot ID is a character, not a wildcard'
);
select is(
  (select puuid from public.player_by_riot_id('Taken Name', 'EUW')),
  'rm-new',
  'of two players with one Riot ID, the one seen most recently carries it'
);
select results_eq(
  $$select ordinal, rank_tier, rank_division
    from public.latest_ranks_by_riot_id(array['Nobody', 'TAKEN NAME', 'Under_Score'], array['XX', 'EUW', 'EUW'])$$,
  $$values (1, null::text, null::text), (2, 'GOLD', 'II'), (3, null, null)$$,
  'each pool place gets its holder''s latest rank, and an unknown or unranked player none'
);

-- Champions ---------------------------------------------------------------------------------------

select results_eq(
  $$select champion_id, games, wins, kills, deaths, assists from public.player_champions('rm-p1', 1, 5)$$,
  $$values (30, 2, 1, 2, 2, 4), (20, 1, 0, 1, 1, 2)$$,
  'a season counts each champion''s games, the wins of its side and the summed KDA, most played first'
);
select results_eq(
  $$select champion_id, games, wins from public.player_champions('rm-p1', 0, 5)$$,
  $$values (30, 2, 1), (10, 1, 1), (20, 1, 0)$$,
  'all time counts every season, and a tie on games goes to the champion with more wins'
);
select results_eq(
  $$select champion_id from public.player_champions('rm-p1', 0, 1)$$,
  $$values (30)$$,
  'the limit keeps the most played'
);

-- Standings after the Nth match ---------------------------------------------------------------------

select results_eq(
  $$select puuid, wins, losses from public.standings_after_match(1, 2, 50)
    where puuid in ('rm-p1', 'rm-p6') order by puuid$$,
  $$values ('rm-p1', 1, 1), ('rm-p6', 1, 1)$$,
  'the standings after the second match include that match and none after it'
);
select is(
  (select count(*)::integer from public.standings_after_match(1, 100000, 50)),
  0,
  'a track with fewer matches has no standings after the Nth'
);

-- Forum ---------------------------------------------------------------------------------------------

select results_eq(
  $$select title, likes, dislikes, comment_count from public.forum_post_list
    where author_id = '40000000-0000-0000-0000-000000000001' order by title$$,
  $$values ('Busy', 2, 1, 1), ('Quiet', 0, 0, 0)$$,
  'a post in the list carries its likes, dislikes and comments'
);

set local role anon;
select is(
  (select likes from public.forum_post_list where title = 'Busy' and author_id = '40000000-0000-0000-0000-000000000001'),
  2,
  'a visitor reads the counts too'
);
reset role;

select * from finish();
rollback;
