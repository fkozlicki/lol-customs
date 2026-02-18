-- OP-style performance score (0-10) for match participants, with MVP/ACE badges.
--
-- This is an OP.GG-inspired evaluation, not the official OP Score. Weights are tunable.
-- Components (each normalized 0-1 within the match, then weighted sum × 10):
--   - KDA: (kills + assists) / max(deaths, 1), normalized by match max
--   - Kill participation: (kills + assists) / team_kills
--   - Damage share: damage to champs / team damage to champs, normalized by match max
--   - CS/min: (total_minions + neutral_minions) / (duration_min), normalized by match max
--   - Vision: vision_score normalized by match max
-- Weights: 0.25 KDA, 0.25 KP, 0.25 damage, 0.15 CS/min, 0.10 vision.
-- MVP = highest op_score on winning team; ACE = highest on losing team.

ALTER TABLE "public"."match_participants"
  ADD COLUMN IF NOT EXISTS "op_score" numeric(3, 1),
  ADD COLUMN IF NOT EXISTS "is_mvp" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_ace" boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION "public"."compute_op_scores_for_match"(p_match_id bigint)
RETURNS void
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_duration_sec int;
  v_win_team_id int;
  v_lose_team_id int;
  v_max_score_win numeric;
  v_max_score_lose numeric;
  v_mvp_puuid text;
  v_ace_puuid text;
BEGIN
  SELECT duration INTO v_duration_sec FROM matches WHERE match_id = p_match_id;
  IF v_duration_sec IS NULL OR v_duration_sec <= 0 THEN
    RETURN;
  END IF;

  -- Compute scores and MVP/ACE in one pass via CTE, then update
  WITH stats AS (
    SELECT
      mp.puuid,
      mp.participant_id,
      mp.team_id,
      mp.win,
      coalesce(mp.kills, 0) AS kills,
      coalesce(mp.deaths, 0) AS deaths,
      coalesce(mp.assists, 0) AS assists,
      coalesce(mp.total_damage_dealt_to_champions, 0) AS dmg_dealt,
      coalesce(mp.total_damage_taken, 0) AS dmg_taken,
      coalesce(mp.total_minions_killed, 0) + coalesce(mp.neutral_minions_killed, 0) AS cs,
      coalesce(mp.vision_score, 0) AS vision
    FROM match_participants mp
    WHERE mp.match_id = p_match_id
  ),
  team_totals AS (
    SELECT
      team_id,
      sum(kills) AS team_kills,
      sum(dmg_dealt) AS team_dmg_dealt
    FROM stats
    GROUP BY team_id
  ),
  kp_and_dmg AS (
    SELECT
      s.puuid,
      s.participant_id,
      s.team_id,
      s.win,
      s.kills,
      s.deaths,
      s.assists,
      s.dmg_dealt,
      s.cs,
      s.vision,
      tt.team_kills,
      tt.team_dmg_dealt,
      CASE WHEN tt.team_kills > 0 THEN (s.kills + s.assists)::numeric / tt.team_kills ELSE 0 END AS kp,
      CASE WHEN greatest(s.deaths, 1) > 0 THEN (s.kills + s.assists)::numeric / greatest(s.deaths, 1) ELSE (s.kills + s.assists)::numeric END AS kda_ratio
    FROM stats s
    JOIN team_totals tt ON s.team_id = tt.team_id
  ),
  bounds AS (
    SELECT
      greatest(max(kda_ratio), 0.01) AS max_kda,
      greatest(max(dmg_dealt::numeric / nullif(team_dmg_dealt, 0)), 0.01) AS max_dmg_share,
      greatest(max(cs::numeric / nullif(v_duration_sec / 60.0, 0)), 0.01) AS max_cs_per_min,
      greatest(max(vision), 1) AS max_vision
    FROM kp_and_dmg
  ),
  normalized AS (
    SELECT
      k.puuid,
      k.participant_id,
      k.team_id,
      k.win,
      least(1.0, k.kda_ratio / b.max_kda) AS kda_norm,
      least(1.0, k.kp) AS kp_norm,
      least(1.0, (k.dmg_dealt::numeric / nullif(k.team_dmg_dealt, 0)) / b.max_dmg_share) AS dmg_norm,
      least(1.0, (k.cs::numeric / nullif(v_duration_sec / 60.0, 0)) / b.max_cs_per_min) AS cs_norm,
      least(1.0, k.vision::numeric / b.max_vision) AS vision_norm
    FROM kp_and_dmg k
    CROSS JOIN bounds b
  ),
  scored AS (
    SELECT
      puuid,
      participant_id,
      team_id,
      win,
      round((0.25 * kda_norm + 0.25 * kp_norm + 0.25 * dmg_norm + 0.15 * cs_norm + 0.10 * vision_norm)::numeric * 10, 1) AS op_score
    FROM normalized
  ),
  with_rank AS (
    SELECT
      s.puuid,
      s.op_score,
      s.win,
      row_number() OVER (PARTITION BY s.win ORDER BY s.op_score DESC) AS rn
    FROM scored s
  )
  UPDATE match_participants mp
  SET
    op_score = wr.op_score,
    is_mvp = (mp.win = true AND wr.rn = 1),
    is_ace = (mp.win = false AND wr.rn = 1)
  FROM with_rank wr
  WHERE mp.match_id = p_match_id AND mp.puuid = wr.puuid;
END;
$$;

-- Trigger: run after match_participants insert when match has 10 participants (separate from ratings).
CREATE OR REPLACE FUNCTION "public"."trg_compute_op_scores"() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT count(*) FROM match_participants WHERE match_id = NEW.match_id) = 10 THEN
    PERFORM compute_op_scores_for_match(NEW.match_id);
  END IF;
  RETURN null;
END;
$$;

DROP TRIGGER IF EXISTS "trg_compute_op_scores" ON "public"."match_participants";
CREATE TRIGGER "trg_compute_op_scores"
  AFTER INSERT ON "public"."match_participants"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."trg_compute_op_scores"();

-- Backfill: compute OP score for all matches that have 10 participants and no score yet.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT match_id
    FROM match_participants
    GROUP BY match_id
    HAVING count(*) = 10
    AND bool_or(op_score IS NULL) = true
  LOOP
    PERFORM compute_op_scores_for_match(r.match_id);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION "public"."compute_op_scores_for_match"(bigint) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."compute_op_scores_for_match"(bigint) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."compute_op_scores_for_match"(bigint) TO "service_role";
