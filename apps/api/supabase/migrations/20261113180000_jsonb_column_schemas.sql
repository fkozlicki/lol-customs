-- JSON Schema checks on the jsonb columns the app and its functions write.
--
-- `packages/supabase/src/types/json.ts` describes the same shapes as Zod schemas, which are also their
-- TypeScript types; change both together. How strict each check is depends on who owns the shape:
--   * `auction_players.rank_snapshot` and `auction_events.payload` are ours and small: every key is
--     described and nothing else is allowed.
--   * forum content is the editor's document: only its outline is checked (a `doc` holding nodes that
--     each have a type), so a new editor extension does not stop anyone posting. A post without a body
--     is an empty object.
-- Riot's match JSON (`matches.raw_json`, `matches.timeline_json`) is written by installed Derby Sync
-- clients and follows Riot's format, so it is not checked (CLAUDE.md: client columns are not tightened).

create extension if not exists pg_jsonschema with schema extensions;

-- An unranked player, as the API writes one. The old default, '{}', would not pass the check below.
alter table public.auction_players
  alter column rank_snapshot set default '{"soloTier": null, "soloDivision": null, "soloRankLabel": ""}',
  drop constraint auction_players_rank_snapshot_check,
  add constraint auction_players_rank_snapshot_check check (
    extensions.jsonb_matches_schema(
      '{
        "type": "object",
        "required": ["soloTier", "soloDivision", "soloRankLabel"],
        "properties": {
          "soloTier": { "type": ["string", "null"] },
          "soloDivision": { "type": ["string", "null"] },
          "soloRankLabel": { "type": "string" }
        },
        "additionalProperties": false
      }',
      rank_snapshot
    )
  );

alter table public.auction_events
  drop constraint auction_events_payload_check,
  add constraint auction_events_payload_check check (
    extensions.jsonb_matches_schema(
      '{
        "type": "object",
        "properties": {
          "reason": { "type": "string" },
          "ready": { "type": "boolean" }
        },
        "additionalProperties": false
      }',
      payload
    )
  );

-- One definition of a valid forum body, for posts and comments alike.
create function public.forum_content_is_valid(p_content jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select extensions.jsonb_matches_schema(
    '{
      "oneOf": [
        { "type": "object", "maxProperties": 0 },
        {
          "type": "object",
          "required": ["type", "content"],
          "properties": {
            "type": { "const": "doc" },
            "content": {
              "type": "array",
              "items": { "type": "object", "required": ["type"], "properties": { "type": { "type": "string" } } }
            }
          }
        }
      ]
    }',
    p_content
  );
$$;

alter table public.forum_posts
  add constraint forum_posts_content_check check (public.forum_content_is_valid(content));

alter table public.forum_comments
  add constraint forum_comments_content_check check (public.forum_content_is_valid(content));
