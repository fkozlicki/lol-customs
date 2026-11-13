begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

-- Counts how often a match's OP scores are computed: the real function is wrapped for this
-- transaction only.
create table tests.op_score_runs (match_id bigint);
alter function public.compute_op_scores_for_match(bigint) rename to compute_op_scores_for_match_real;
create function public.compute_op_scores_for_match(p_match_id bigint)
returns void
language plpgsql
as $$
begin
  insert into tests.op_score_runs values (p_match_id);
  perform public.compute_op_scores_for_match_real(p_match_id);
end;
$$;

insert into public.players (puuid, game_name, tag_line)
select 'upload-p' || n, 'Upload' || n, 'EUW' from generate_series(1, 11) n;

create function tests.seed_upload_match(p_match_id bigint, p_game_creation timestamptz)
returns void
language sql
as $$
  insert into public.matches (match_id, platform_id, game_creation, duration, raw_json)
  values (p_match_id, 'EUN1', p_game_creation, 1800, '{}'::jsonb);
$$;

-- Participants first..last of a match, the first five on side 100, which wins.
create function tests.upload_participants(p_match_id bigint, p_first integer, p_last integer)
returns void
language sql
as $$
  insert into public.match_participants (
    match_id, puuid, participant_id, team_id, win, kills, deaths, assists,
    total_damage_dealt_to_champions, gold_earned, total_minions_killed, vision_score
  )
  select
    p_match_id, 'upload-p' || n, n,
    case when n <= 5 then 100 else 200 end,
    n <= 5,
    n, 3, 5, 10000 + n * 500, 9000 + n * 300, 150 + n * 10, 20 + n
  from generate_series(p_first, p_last) n
  on conflict (match_id, puuid) do update set kills = excluded.kills;
$$;

create function tests.op_runs(p_match_id bigint)
returns bigint
language sql
stable
as $$
  select count(*) from tests.op_score_runs where match_id = p_match_id;
$$;

create function tests.snapshots(p_match_id bigint)
returns bigint
language sql
stable
as $$
  select count(*) from public.rating_history where match_id = p_match_id;
$$;

select plan(12);

-- One upload, one statement -------------------------------------------------------------

select tests.seed_upload_match(9990000001, '2020-06-01T12:00:00Z');
select tests.upload_participants(9990000001, 1, 10);

select is(tests.op_runs(9990000001), 1::bigint, 'an upload computes the OP scores of its match once');
select is(
  (select count(*) from public.match_participants where match_id = 9990000001 and op_score is not null),
  10::bigint, 'every participant gets an OP score'
);
select is(
  (select count(*) from public.match_participants where match_id = 9990000001 and is_mvp), 1::bigint,
  'the match gets one MVP'
);
select is(tests.snapshots(9990000001), 20::bigint, 'the match is rated on its season and the all-time track');
select ok(
  (select bool_and(rh.rating_after is not null) from public.rating_history rh where rh.match_id = 9990000001),
  'every participant has a rating after the match'
);

-- Uploading the same match again ---------------------------------------------------------

create temp table before_reupload as
select puuid, op_score, rating_after from public.match_participants
join public.rating_history using (match_id, puuid)
where match_id = 9990000001 and ladder_season_id = 0;

select tests.upload_participants(9990000001, 1, 10);

select is(tests.op_runs(9990000001), 1::bigint, 'uploading a match again computes nothing');
select is(
  (
    select count(*) from before_reupload b
    join public.match_participants mp on mp.match_id = 9990000001 and mp.puuid = b.puuid
    join public.rating_history rh on rh.match_id = 9990000001 and rh.puuid = b.puuid and rh.ladder_season_id = 0
    where (mp.op_score, rh.rating_after) is distinct from (b.op_score, b.rating_after)
  ),
  0::bigint, 'uploading a match again leaves its OP scores and ratings'
);

-- Participants arriving in two statements ------------------------------------------------

select tests.seed_upload_match(9990000002, '2020-06-02T12:00:00Z');
select tests.upload_participants(9990000002, 1, 5);

select is(tests.op_runs(9990000002), 0::bigint, 'half a match computes no OP scores');
select is(tests.snapshots(9990000002), 0::bigint, 'half a match is not rated');

select tests.upload_participants(9990000002, 6, 10);

select is(tests.op_runs(9990000002), 1::bigint, 'the statement that completes a match computes its OP scores once');
select is(tests.snapshots(9990000002), 20::bigint, 'the statement that completes a match rates it');

-- Not a match: eleven participants ------------------------------------------------------------

select tests.seed_upload_match(9990000003, '2020-06-03T12:00:00Z');
select tests.upload_participants(9990000003, 1, 11);

select is(
  tests.op_runs(9990000003) + tests.snapshots(9990000003), 0::bigint,
  'eleven participants get neither OP scores nor a rating'
);

select * from finish();
rollback;
