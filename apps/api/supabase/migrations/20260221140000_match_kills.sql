-- Per-match kill events (killer participant -> victim participant) for "most killed" / "mostly killed by" stats.
-- One row per kill; backfilled from matches.timeline_json CHAMPION_KILL events.

CREATE TABLE IF NOT EXISTS "public"."match_kills" (
  "match_id" bigint NOT NULL,
  "killer_participant_id" integer NOT NULL,
  "victim_participant_id" integer NOT NULL
);

ALTER TABLE "public"."match_kills" OWNER TO "postgres";

ALTER TABLE ONLY "public"."match_kills"
  ADD CONSTRAINT "match_kills_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("match_id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "idx_match_kills_match_id" ON "public"."match_kills" ("match_id");
CREATE INDEX IF NOT EXISTS "idx_match_kills_victim_killer" ON "public"."match_kills" ("victim_participant_id", "killer_participant_id");
CREATE INDEX IF NOT EXISTS "idx_match_kills_killer_victim" ON "public"."match_kills" ("killer_participant_id", "victim_participant_id");

GRANT ALL ON TABLE "public"."match_kills" TO "anon";
GRANT ALL ON TABLE "public"."match_kills" TO "authenticated";
GRANT ALL ON TABLE "public"."match_kills" TO "service_role";

-- Backfill: extract CHAMPION_KILL events from matches.timeline_json (exclude killerId = 0).
INSERT INTO "public"."match_kills" ("match_id", "killer_participant_id", "victim_participant_id")
SELECT
  m.match_id,
  (e->>'killerId')::int AS killer_participant_id,
  (e->>'victimId')::int AS victim_participant_id
FROM "public"."matches" m,
     jsonb_array_elements(
       CASE
         WHEN m.timeline_json IS NOT NULL
          AND jsonb_typeof(m.timeline_json->'frames') = 'array'
         THEN m.timeline_json->'frames'
         ELSE '[]'::jsonb
       END
     ) AS fr(frames),
     jsonb_array_elements(
       CASE
         WHEN jsonb_typeof(fr.frames->'events') = 'array' THEN fr.frames->'events'
         ELSE '[]'::jsonb
       END
     ) AS e(event)
WHERE (e.event->>'type') = 'CHAMPION_KILL'
  AND (e.event->>'killerId')::int > 0
  AND (e.event->>'victimId')::int > 0;
