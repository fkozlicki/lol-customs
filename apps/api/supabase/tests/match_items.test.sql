begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

-- OP scores and ratings are irrelevant here.
alter table public.match_participants disable trigger trg_compute_op_scores;
alter table public.match_participants disable trigger trg_update_ratings;

insert into public.players (puuid, game_name, tag_line)
values ('items-p1', 'ItemsOne', 'EUW'), ('items-p2', 'ItemsTwo', 'EUW'), ('items-p3', 'ItemsThree', 'EUW');

-- Riot's match JSON as Derby Sync stores it: participant 1 with a full inventory, participant 2 with
-- empty slots. Participant 3 is missing from it.
insert into public.matches (match_id, platform_id, game_creation, duration, raw_json)
values (9980000001, 'EUN1', '2020-05-01T12:00:00Z', 1800, jsonb_build_object('participants', jsonb_build_array(
  jsonb_build_object('participantId', 1, 'spell1Id', 4, 'spell2Id', 14, 'stats', jsonb_build_object(
    'item0', 1055, 'item1', 3078, 'item2', 3047, 'item3', 6610, 'item4', 6333, 'item5', 1036, 'item6', 3340)),
  jsonb_build_object('participantId', 2, 'spell1Id', 11, 'spell2Id', 4, 'stats', jsonb_build_object(
    'item0', 3071, 'item1', 0, 'item2', 0, 'item3', 0, 'item4', 0, 'item5', 0, 'item6', 3364))
)));

-- Participants arrive after the match, like an upload.
insert into public.match_participants (match_id, puuid, participant_id, team_id, win)
values (9980000001, 'items-p1', 1, 100, true),
       (9980000001, 'items-p2', 2, 100, true),
       (9980000001, 'items-p3', 3, 200, false);

select plan(6);

select is(
  (select item_ids from public.match_participants where match_id = 9980000001 and puuid = 'items-p1'),
  array[1055, 3078, 3047, 6610, 6333, 1036, 3340],
  'an uploaded participant gets their items in inventory slot order, the trinket last'
);
select is(
  (select item_ids from public.match_participants where match_id = 9980000001 and puuid = 'items-p2'),
  array[3071, 0, 0, 0, 0, 0, 3364],
  'an empty inventory slot stays 0'
);
select is(
  (select item_ids from public.match_participants where match_id = 9980000001 and puuid = 'items-p3'),
  null::integer[],
  'a participant missing from the match JSON has no items'
);

-- Uploading the match again, as Derby Sync upserts participants.
insert into public.match_participants (match_id, puuid, participant_id, team_id, win)
values (9980000001, 'items-p1', 1, 100, true)
on conflict (match_id, puuid) do update set participant_id = excluded.participant_id, win = excluded.win;

select is(
  (select item_ids from public.match_participants where match_id = 9980000001 and puuid = 'items-p1'),
  array[1055, 3078, 3047, 6610, 6333, 1036, 3340],
  'uploading a match again keeps the items'
);

update public.match_participants set op_score = 7.5 where match_id = 9980000001 and puuid = 'items-p2';
select is(
  (select item_ids from public.match_participants where match_id = 9980000001 and puuid = 'items-p2'),
  array[3071, 0, 0, 0, 0, 0, 3364],
  'other updates to a participant leave the items alone'
);

-- Matches uploaded before the column existed were filled in by the migration.
select is(
  (
    select count(*)
    from public.match_participants mp
    join public.matches m using (match_id)
    where mp.item_ids is null
      and mp.match_id <> 9980000001
      and exists (
        select 1 from jsonb_array_elements(m.raw_json->'participants') p
        where (p->>'participantId')::int = mp.participant_id
      )
  ),
  0::bigint,
  'every participant already uploaded has their items'
);

select * from finish();
rollback;
