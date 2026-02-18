-- Fix: compute_op_scores_for_match must be VOLATILE (default), not STABLE,
-- because it performs UPDATE. STABLE was incorrectly set in the previous migration.
CREATE OR REPLACE FUNCTION "public"."compute_op_scores_for_match"(p_match_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_duration_sec int;
BEGIN
  SELECT duration INTO v_duration_sec FROM matches WHERE match_id = p_match_id;
  IF v_duration_sec IS NULL OR v_duration_sec <= 0 THEN
    RETURN;
  END IF;

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
