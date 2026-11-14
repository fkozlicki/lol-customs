begin;

create extension if not exists pgtap with schema extensions;
create schema if not exists tests;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-000000000001', 'authenticated',
  'authenticated', 'json-schema@example.test', '', now(), '{}', '{}', now(), now()
);
insert into public.user_profiles (id, nickname) values ('30000000-0000-0000-0000-000000000001', 'json-schema');
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);

-- A pool of eight, each with the rank the API attaches.
create function tests.pool(p_rank jsonb)
returns jsonb
language sql
immutable
as $$
  select jsonb_agg(jsonb_build_object('gameName', 'Json' || n, 'tagLine', 'EUW', 'rank', p_rank))
  from generate_series(1, 8) n;
$$;

select plan(11);

-- Auction ranks ----------------------------------------------------------------------------------

select lives_ok(
  $$select public.auction_create_room(gen_random_uuid(),
      tests.pool('{"soloTier": "GOLD", "soloDivision": "I", "soloRankLabel": "Gold I"}'), 'A', 20, 30, false)$$,
  'a pool with a rank for every player is stored'
);
-- Make way for the next room.
select public.auction_cancel(
  (select room_id from public.auction_captains where user_id = '30000000-0000-0000-0000-000000000001'),
  gen_random_uuid()
);
select lives_ok(
  $$select public.auction_create_room(gen_random_uuid(),
      tests.pool('{"soloTier": null, "soloDivision": null, "soloRankLabel": ""}'), 'A', 20, 30, false)$$,
  'an unranked player has no tier and an empty label'
);
select throws_ok(
  $$select public.auction_create_room(gen_random_uuid(),
      tests.pool('{"soloTier": "GOLD"}'), 'A', 20, 30, false)$$,
  '23514', null,
  'a rank without its division and label is refused'
);
select throws_ok(
  $$select public.auction_create_room(gen_random_uuid(), tests.pool(null), 'A', 20, 30, false)$$,
  'P0001', 'AUCTION_PLAYERS_INVALID',
  'a pool player without a rank is an invalid pool'
);
select throws_ok(
  $$select public.auction_update_lobby(
      (select c.room_id from public.auction_captains c join public.auction_rooms r on r.id = c.room_id
       where c.user_id = '30000000-0000-0000-0000-000000000001' and r.status = 'waiting'),
      gen_random_uuid(), null, null, null, tests.pool(null), null)$$,
  'P0001', 'AUCTION_PLAYERS_INVALID',
  'a lobby cannot swap in a pool player without a rank'
);

-- Auction event payloads -------------------------------------------------------------------------

select lives_ok(
  $$insert into public.auction_events (room_id, event_type, payload)
    select room_id, 'sold', '{"reason": "deadline"}' from public.auction_captains
    where user_id = '30000000-0000-0000-0000-000000000001' and room_id in (select id from public.auction_rooms where status = 'waiting')$$,
  'an event says why a player was sold'
);
select throws_ok(
  $$insert into public.auction_events (room_id, event_type, payload)
    select room_id, 'bid', '{"amount": "7"}' from public.auction_captains
    where user_id = '30000000-0000-0000-0000-000000000001' limit 1$$,
  '23514', null,
  'an event cannot carry keys nothing reads'
);

-- Forum content ----------------------------------------------------------------------------------

select lives_ok(
  $$insert into public.forum_posts (author_id, title, content)
    values ('30000000-0000-0000-0000-000000000001', 'Title only', '{}')$$,
  'a post without a body is an empty object'
);
select lives_ok(
  $$insert into public.forum_posts (author_id, title, content)
    values ('30000000-0000-0000-0000-000000000001', 'With a body',
      '{"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "hi"}]}, {"type": "image", "attrs": {"src": "x"}}]}')$$,
  'a post keeps whatever nodes the editor writes'
);
select throws_ok(
  $$insert into public.forum_posts (author_id, title, content)
    values ('30000000-0000-0000-0000-000000000001', 'Not a document', '{"text": "hi"}')$$,
  '23514', null,
  'a post body that is not the editor''s document is refused'
);
select throws_ok(
  $$insert into public.forum_comments (post_id, author_id, content)
    select id, '30000000-0000-0000-0000-000000000001', '{"type": "doc", "content": [{"text": "no type"}]}'
    from public.forum_posts where title = 'With a body'$$,
  '23514', null,
  'a comment whose nodes have no type is refused'
);

select * from finish();
rollback;
