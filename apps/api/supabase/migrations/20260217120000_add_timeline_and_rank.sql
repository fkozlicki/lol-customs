-- matches: timeline for frame-by-frame data (gold/XP curves, objective timings)
ALTER TABLE "public"."matches"
  ADD COLUMN IF NOT EXISTS "timeline_json" jsonb NOT NULL DEFAULT '{}';

-- match_participants: optional solo/duo rank for average lobby rank / OP-style score
ALTER TABLE "public"."match_participants"
  ADD COLUMN IF NOT EXISTS "rank_tier" text,
  ADD COLUMN IF NOT EXISTS "rank_division" text;
