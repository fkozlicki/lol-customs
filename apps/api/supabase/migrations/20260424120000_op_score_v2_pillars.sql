-- OP Score v2: four-pillar, role-aware composite (Combat, Economy, Utility, Timeline).
--
-- Goals (see docs/formulas.md for full spec):
--   1. End-of-game stats are first-class (C, E, U) and carry the majority of the score.
--   2. Timeline (T) is progression-only, time-weighted, with an explicit end-of-game anchor.
--   3. Role-aware weights so every role can legitimately top MVP when they played their job.
--   4. Deterministic MVP/ACE selection and higher precision so scores strictly order.
--
-- Composite: op_score = 10 * (w_C * C + w_E * E + w_U * U + w_T * T), stored as numeric(5, 3).

-- 1. Widen precision so scores can strictly order and avoid duplicate values on the leaderboard.
ALTER TABLE "public"."match_participants"
  ALTER COLUMN "op_score" TYPE numeric(5, 3);

-- Drop the previous 3-arg timeline function; the v2 version adds a cadence parameter so the
-- old overload would otherwise linger in the catalog alongside the replacement.
DROP FUNCTION IF EXISTS "public"."_compute_op_scores_timeline"(bigint, int, jsonb);

-- 2. Role-bucket classifier (CARRY / MID / TOP / JUNGLE / SUPPORT / UNKNOWN).
--    Uses Riot timeline.role + timeline.lane as stored in match_participants, with a CS-based
--    tiebreaker for ambiguous BOTTOM duos and a neutral-minion heuristic for jungle detection.
CREATE OR REPLACE FUNCTION "public"."_op_role_bucket"(
  p_role text,
  p_lane text,
  p_minions integer,
  p_neutral integer
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_role = 'DUO_SUPPORT' THEN 'SUPPORT'
    WHEN p_role = 'DUO_CARRY' THEN 'CARRY'
    WHEN p_lane = 'JUNGLE' OR coalesce(p_neutral, 0) >= 60 THEN 'JUNGLE'
    WHEN p_lane = 'BOTTOM' THEN (
      CASE WHEN coalesce(p_minions, 0) < 50 THEN 'SUPPORT' ELSE 'CARRY' END
    )
    WHEN p_lane = 'MIDDLE' THEN 'MID'
    WHEN p_lane = 'TOP' THEN 'TOP'
    ELSE 'UNKNOWN'
  END;
$$;

GRANT EXECUTE ON FUNCTION "public"."_op_role_bucket"(text, text, integer, integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."_op_role_bucket"(text, text, integer, integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."_op_role_bucket"(text, text, integer, integer) TO "service_role";

-- 3. Entry point: loads match, decides cadence (SR 300s / ARAM 180s), picks timeline vs fallback path.
CREATE OR REPLACE FUNCTION "public"."compute_op_scores_for_match"(p_match_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_duration_sec int;
  v_timeline jsonb;
  v_queue_id int;
  v_map_id int;
  v_cadence_sec int;
  v_has_timeline boolean;
BEGIN
  SELECT duration, timeline_json, queue_id, map_id
  INTO v_duration_sec, v_timeline, v_queue_id, v_map_id
  FROM matches
  WHERE match_id = p_match_id;

  IF v_duration_sec IS NULL OR v_duration_sec <= 0 THEN
    RETURN;
  END IF;

  -- ARAM (Howling Abyss, queue 450 / ARURF 900 / Poro King 920 / old ARAM 100) uses a
  -- 3-minute cadence per OP.GG docs; other modes use 5-minute SR cadence.
  IF v_map_id = 12 OR v_queue_id IN (100, 450, 900, 920) THEN
    v_cadence_sec := 180;
  ELSE
    v_cadence_sec := 300;
  END IF;

  v_has_timeline := (
    v_timeline IS NOT NULL
    AND v_timeline != '{}'::jsonb
    AND jsonb_typeof(v_timeline->'frames') = 'array'
    AND jsonb_array_length(v_timeline->'frames') > 0
  );

  IF NOT v_has_timeline OR v_duration_sec < v_cadence_sec THEN
    PERFORM _compute_op_scores_fallback(p_match_id, v_duration_sec);
    RETURN;
  END IF;

  PERFORM _compute_op_scores_timeline(p_match_id, v_duration_sec, v_timeline, v_cadence_sec);
END;
$$;

-- 4. Fallback (no timeline): compute C, E, U with role weights where T's share is redistributed.
CREATE OR REPLACE FUNCTION "public"."_compute_op_scores_fallback"(
  p_match_id bigint,
  v_duration_sec int
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_duration_min numeric;
BEGIN
  v_duration_min := greatest(v_duration_sec / 60.0, 1);

  WITH participants AS (
    SELECT
      mp.puuid,
      mp.participant_id,
      mp.team_id,
      mp.win,
      _op_role_bucket(mp.role, mp.lane, mp.total_minions_killed, mp.neutral_minions_killed) AS role_bucket,
      coalesce(mp.kills, 0) AS kills,
      coalesce(mp.deaths, 0) AS deaths,
      coalesce(mp.assists, 0) AS assists,
      coalesce(mp.total_damage_dealt_to_champions, 0) AS dmg_to_champs,
      coalesce(mp.gold_earned, 0) AS gold_earned,
      coalesce(mp.total_minions_killed, 0) AS minions,
      coalesce(mp.neutral_minions_killed, 0) AS neutral_minions,
      coalesce(mp.vision_score, 0) AS vision_score,
      coalesce(mp.time_ccing_others, 0) AS cc_time,
      coalesce(mp.total_damage_taken, 0) AS dmg_taken,
      coalesce(mp.damage_self_mitigated, 0) AS dmg_mitigated,
      coalesce(mp.turret_kills, 0) AS turret_kills,
      coalesce(mp.inhibitor_kills, 0) AS inhib_kills
    FROM match_participants mp
    WHERE mp.match_id = p_match_id
  ),
  team_totals AS (
    SELECT team_id,
      sum(kills) AS team_kills,
      sum(dmg_to_champs) AS team_dmg,
      sum(dmg_taken) AS team_taken,
      sum(dmg_mitigated) AS team_mitig
    FROM participants
    GROUP BY team_id
  ),
  raw_stats AS (
    SELECT
      p.*,
      tt.team_kills,
      tt.team_dmg,
      tt.team_taken,
      tt.team_mitig,
      CASE WHEN tt.team_dmg > 0 THEN p.dmg_to_champs::numeric / tt.team_dmg ELSE 0 END AS dmg_share,
      CASE WHEN tt.team_kills > 0 THEN (p.kills + p.assists)::numeric / tt.team_kills ELSE 0 END AS kp,
      (p.kills + 0.75 * p.assists)::numeric / greatest(p.deaths, 1) AS smart_kda,
      (p.minions + p.neutral_minions)::numeric / v_duration_min AS cs_per_min,
      p.vision_score::numeric / v_duration_min AS vision_per_min,
      CASE WHEN tt.team_taken > 0 THEN p.dmg_taken::numeric / tt.team_taken ELSE 0 END AS taken_share,
      CASE WHEN tt.team_mitig > 0 THEN p.dmg_mitigated::numeric / tt.team_mitig ELSE 0 END AS mitig_share,
      (p.turret_kills + p.inhib_kills)::numeric AS objectives
    FROM participants p
    JOIN team_totals tt ON tt.team_id = p.team_id
  ),
  match_max AS (
    SELECT
      greatest(max(dmg_share), 0.01) AS max_dmg_share,
      greatest(max(smart_kda), 0.01) AS max_smart_kda,
      greatest(max(vision_per_min), 0.01) AS max_vpm,
      greatest(max(cc_time), 1) AS max_cc,
      greatest(max(greatest(taken_share, mitig_share)), 0.01) AS max_tank,
      greatest(max(objectives), 1) AS max_obj
    FROM raw_stats
  ),
  role_max AS (
    SELECT role_bucket,
      greatest(max(gold_earned), 1) AS max_gold,
      greatest(max(cs_per_min), 0.1) AS max_cs_per_min
    FROM raw_stats
    GROUP BY role_bucket
  ),
  pillars AS (
    SELECT
      rs.puuid,
      rs.participant_id,
      rs.team_id,
      rs.win,
      rs.role_bucket,
      rs.dmg_share,
      rs.vision_per_min,
      -- Combat: damage share + KP + smart KDA
      (
        0.45 * least(1.0, rs.dmg_share / mm.max_dmg_share)
        + 0.35 * least(1.0, rs.kp)
        + 0.20 * least(1.0, rs.smart_kda / mm.max_smart_kda)
      ) AS pillar_c,
      -- Economy: gold + CS/min, both normalized within role bucket
      (
        0.55 * least(1.0, rs.gold_earned::numeric / rm.max_gold)
        + 0.45 * least(1.0, rs.cs_per_min / rm.max_cs_per_min)
      ) AS pillar_e,
      -- Utility: vision + CC + tanking + objectives (all match-wide)
      (
        0.30 * least(1.0, rs.vision_per_min / mm.max_vpm)
        + 0.25 * least(1.0, rs.cc_time::numeric / mm.max_cc)
        + 0.30 * least(1.0, greatest(rs.taken_share, rs.mitig_share) / mm.max_tank)
        + 0.15 * least(1.0, rs.objectives / mm.max_obj)
      ) AS pillar_u
    FROM raw_stats rs
    CROSS JOIN match_max mm
    JOIN role_max rm ON rm.role_bucket = rs.role_bucket
  ),
  -- Fallback role weights: T's 0.23 is redistributed proportionally across C, E, U.
  weighted AS (
    SELECT
      p.*,
      CASE p.role_bucket
        WHEN 'CARRY'   THEN 0.52
        WHEN 'MID'     THEN 0.52
        WHEN 'TOP'     THEN 0.43
        WHEN 'JUNGLE'  THEN 0.43
        WHEN 'SUPPORT' THEN 0.32
        ELSE                0.46
      END AS w_c,
      CASE p.role_bucket
        WHEN 'CARRY'   THEN 0.35
        WHEN 'MID'     THEN 0.32
        WHEN 'TOP'     THEN 0.32
        WHEN 'JUNGLE'  THEN 0.29
        WHEN 'SUPPORT' THEN 0.16
        ELSE                0.32
      END AS w_e,
      CASE p.role_bucket
        WHEN 'CARRY'   THEN 0.13
        WHEN 'MID'     THEN 0.16
        WHEN 'TOP'     THEN 0.25
        WHEN 'JUNGLE'  THEN 0.28
        WHEN 'SUPPORT' THEN 0.52
        ELSE                0.22
      END AS w_u
    FROM pillars p
  ),
  scored AS (
    SELECT
      puuid,
      participant_id,
      win,
      dmg_share,
      vision_per_min,
      pillar_c,
      pillar_u,
      w_c,
      w_u,
      round(
        (10.0 * (w_c * pillar_c + w_e * pillar_e + w_u * pillar_u))::numeric,
        3
      ) AS op_score,
      (w_c * pillar_c + w_u * pillar_u) AS impact
    FROM weighted
  ),
  ranked AS (
    SELECT s.*,
      row_number() OVER (
        PARTITION BY s.win
        ORDER BY
          s.op_score DESC,
          s.impact DESC,
          s.dmg_share DESC,
          s.vision_per_min DESC,
          s.participant_id ASC
      ) AS rn
    FROM scored s
  )
  UPDATE match_participants mp
  SET op_score = r.op_score,
      is_mvp = (mp.win = true AND r.rn = 1),
      is_ace = (mp.win = false AND r.rn = 1)
  FROM ranked r
  WHERE mp.match_id = p_match_id AND mp.puuid = r.puuid;
END;
$$;

-- 5. Timeline path: C + E + U (same as fallback) plus a time-weighted Timeline pillar T
--    built from cadence-spaced checkpoints + an explicit game-end snapshot.
CREATE OR REPLACE FUNCTION "public"."_compute_op_scores_timeline"(
  p_match_id bigint,
  v_duration_sec int,
  v_timeline jsonb,
  v_cadence_sec int
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_duration_min numeric;
  v_num_periodic int;
BEGIN
  v_duration_min := greatest(v_duration_sec / 60.0, 1);
  v_num_periodic := v_duration_sec / v_cadence_sec;

  WITH
  -- Periodic checkpoints at cadence, 2*cadence, ... + end-of-game anchor.
  targets AS (
    SELECT (n * v_cadence_sec)::bigint * 1000 AS target_ts
    FROM generate_series(1, v_num_periodic) n
    UNION
    SELECT v_duration_sec::bigint * 1000 AS target_ts
  ),
  frames_expanded AS (
    SELECT
      (elem->>'timestamp')::bigint AS frame_ts,
      elem->'participantFrames' AS participant_frames
    FROM jsonb_array_elements(v_timeline->'frames') elem
  ),
  best_frame AS (
    SELECT DISTINCT ON (t.target_ts)
      t.target_ts,
      f.frame_ts,
      f.participant_frames
    FROM targets t
    CROSS JOIN frames_expanded f
    ORDER BY t.target_ts, abs(f.frame_ts - t.target_ts)
  ),
  participants AS (
    SELECT
      mp.participant_id,
      mp.team_id,
      mp.puuid,
      mp.win,
      _op_role_bucket(mp.role, mp.lane, mp.total_minions_killed, mp.neutral_minions_killed) AS role_bucket,
      coalesce(mp.kills, 0) AS kills,
      coalesce(mp.deaths, 0) AS deaths,
      coalesce(mp.assists, 0) AS assists,
      coalesce(mp.total_damage_dealt_to_champions, 0) AS dmg_to_champs,
      coalesce(mp.gold_earned, 0) AS gold_earned,
      coalesce(mp.total_minions_killed, 0) AS minions,
      coalesce(mp.neutral_minions_killed, 0) AS neutral_minions,
      coalesce(mp.vision_score, 0) AS vision_score,
      coalesce(mp.time_ccing_others, 0) AS cc_time,
      coalesce(mp.total_damage_taken, 0) AS dmg_taken,
      coalesce(mp.damage_self_mitigated, 0) AS dmg_mitigated,
      coalesce(mp.turret_kills, 0) AS turret_kills,
      coalesce(mp.inhibitor_kills, 0) AS inhib_kills
    FROM match_participants mp
    WHERE mp.match_id = p_match_id
  ),
  team_totals AS (
    SELECT team_id,
      sum(kills) AS team_kills,
      sum(dmg_to_champs) AS team_dmg,
      sum(dmg_taken) AS team_taken,
      sum(dmg_mitigated) AS team_mitig
    FROM participants
    GROUP BY team_id
  ),
  kill_events AS (
    SELECT (e->>'timestamp')::bigint AS event_ts, (e->>'killerId')::int AS participant_id
    FROM jsonb_array_elements(v_timeline->'frames') fr,
         jsonb_array_elements(fr->'events') e
    WHERE (e->>'type') = 'CHAMPION_KILL'
  ),
  death_events AS (
    SELECT (e->>'timestamp')::bigint AS event_ts, (e->>'victimId')::int AS participant_id
    FROM jsonb_array_elements(v_timeline->'frames') fr,
         jsonb_array_elements(fr->'events') e
    WHERE (e->>'type') = 'CHAMPION_KILL'
  ),
  assist_events AS (
    SELECT (e->>'timestamp')::bigint AS event_ts, (a::text)::int AS participant_id
    FROM jsonb_array_elements(v_timeline->'frames') fr,
         jsonb_array_elements(fr->'events') e,
         jsonb_array_elements_text(coalesce(e->'assistingParticipantIds', '[]'::jsonb)) a
    WHERE (e->>'type') = 'CHAMPION_KILL'
  ),
  -- Per-snapshot gold / XP / CS from the closest timeline frame and cumulative K/D/A up to target_ts.
  snapshot_raw AS (
    SELECT
      bf.target_ts,
      pp.participant_id,
      pp.puuid,
      pp.win,
      pp.team_id,
      pp.role_bucket,
      coalesce((bf.participant_frames->(pp.participant_id::text))->>'totalGold', '0')::numeric AS gold,
      coalesce((bf.participant_frames->(pp.participant_id::text))->>'xp', '0')::numeric AS xp,
      (
        coalesce((bf.participant_frames->(pp.participant_id::text))->>'minionsKilled', '0')::numeric
        + coalesce((bf.participant_frames->(pp.participant_id::text))->>'jungleMinionsKilled', '0')::numeric
      ) AS cs,
      (SELECT count(*)::numeric FROM kill_events k WHERE k.participant_id = pp.participant_id AND k.event_ts <= bf.target_ts) AS kills_cum,
      (SELECT count(*)::numeric FROM death_events d WHERE d.participant_id = pp.participant_id AND d.event_ts <= bf.target_ts) AS deaths_cum,
      (SELECT count(*)::numeric FROM assist_events a WHERE a.participant_id = pp.participant_id AND a.event_ts <= bf.target_ts) AS assists_cum,
      (SELECT count(*)::numeric FROM kill_events k JOIN participants pp2 ON pp2.participant_id = k.participant_id WHERE pp2.team_id = pp.team_id AND k.event_ts <= bf.target_ts) AS team_kills_cum
    FROM best_frame bf
    CROSS JOIN participants pp
  ),
  snapshot_kda AS (
    SELECT
      s.*,
      (s.kills_cum + 0.75 * s.assists_cum) / greatest(s.deaths_cum, 1) AS smart_kda,
      CASE WHEN s.team_kills_cum > 0 THEN (s.kills_cum + s.assists_cum) / s.team_kills_cum ELSE 0 END AS kp
    FROM snapshot_raw s
  ),
  -- Role-fair normalization of economy per snapshot; global KDA/KP normalization per snapshot.
  role_max_at_ts AS (
    SELECT target_ts, role_bucket,
      greatest(max(gold), 1) AS max_gold,
      greatest(max(xp), 1) AS max_xp,
      greatest(max(cs), 1) AS max_cs
    FROM snapshot_kda
    GROUP BY target_ts, role_bucket
  ),
  global_kda_max_at_ts AS (
    SELECT target_ts,
      greatest(max(smart_kda), 0.01) AS max_smart_kda,
      greatest(max(kp), 0.01) AS max_kp
    FROM snapshot_kda
    GROUP BY target_ts
  ),
  snapshot_norms AS (
    SELECT
      s.participant_id,
      s.puuid,
      s.win,
      s.target_ts,
      least(1.0, s.gold / rm.max_gold) AS gold_n,
      least(1.0, s.xp / rm.max_xp) AS xp_n,
      least(1.0, s.cs / rm.max_cs) AS cs_n,
      least(1.0, s.smart_kda / gm.max_smart_kda) AS kda_n,
      least(1.0, s.kp / gm.max_kp) AS kp_n
    FROM snapshot_kda s
    JOIN role_max_at_ts rm ON rm.target_ts = s.target_ts AND rm.role_bucket = s.role_bucket
    JOIN global_kda_max_at_ts gm ON gm.target_ts = s.target_ts
  ),
  -- Snapshot value: 55% economy, 45% combat. Time weight: w(t) = 0.5 + t/duration (end ≈ 1.5).
  snapshot_value AS (
    SELECT
      participant_id,
      puuid,
      win,
      target_ts,
      (0.55 * (gold_n + xp_n + cs_n) / 3.0) + (0.45 * (kda_n + kp_n) / 2.0) AS snap,
      (0.5 + (target_ts::numeric / 1000.0) / greatest(v_duration_sec, 1)) AS w
    FROM snapshot_norms
  ),
  timeline_pillar AS (
    SELECT
      participant_id,
      puuid,
      win,
      sum(snap * w) / nullif(sum(w), 0) AS pillar_t
    FROM snapshot_value
    GROUP BY participant_id, puuid, win
  ),
  -- End-of-game pillars (same shape as the fallback).
  raw_stats AS (
    SELECT
      p.puuid,
      p.participant_id,
      p.team_id,
      p.win,
      p.role_bucket,
      p.gold_earned,
      p.minions,
      p.neutral_minions,
      p.vision_score,
      p.cc_time,
      p.turret_kills,
      p.inhib_kills,
      CASE WHEN tt.team_dmg > 0 THEN p.dmg_to_champs::numeric / tt.team_dmg ELSE 0 END AS dmg_share,
      CASE WHEN tt.team_kills > 0 THEN (p.kills + p.assists)::numeric / tt.team_kills ELSE 0 END AS kp,
      (p.kills + 0.75 * p.assists)::numeric / greatest(p.deaths, 1) AS smart_kda,
      (p.minions + p.neutral_minions)::numeric / v_duration_min AS cs_per_min,
      p.vision_score::numeric / v_duration_min AS vision_per_min,
      CASE WHEN tt.team_taken > 0 THEN p.dmg_taken::numeric / tt.team_taken ELSE 0 END AS taken_share,
      CASE WHEN tt.team_mitig > 0 THEN p.dmg_mitigated::numeric / tt.team_mitig ELSE 0 END AS mitig_share,
      (p.turret_kills + p.inhib_kills)::numeric AS objectives
    FROM participants p
    JOIN team_totals tt ON tt.team_id = p.team_id
  ),
  match_max AS (
    SELECT
      greatest(max(dmg_share), 0.01) AS max_dmg_share,
      greatest(max(smart_kda), 0.01) AS max_smart_kda,
      greatest(max(vision_per_min), 0.01) AS max_vpm,
      greatest(max(cc_time), 1) AS max_cc,
      greatest(max(greatest(taken_share, mitig_share)), 0.01) AS max_tank,
      greatest(max(objectives), 1) AS max_obj
    FROM raw_stats
  ),
  role_max AS (
    SELECT role_bucket,
      greatest(max(gold_earned), 1) AS max_gold,
      greatest(max(cs_per_min), 0.1) AS max_cs_per_min
    FROM raw_stats
    GROUP BY role_bucket
  ),
  pillars AS (
    SELECT
      rs.puuid,
      rs.participant_id,
      rs.win,
      rs.role_bucket,
      rs.dmg_share,
      rs.vision_per_min,
      (
        0.45 * least(1.0, rs.dmg_share / mm.max_dmg_share)
        + 0.35 * least(1.0, rs.kp)
        + 0.20 * least(1.0, rs.smart_kda / mm.max_smart_kda)
      ) AS pillar_c,
      (
        0.55 * least(1.0, rs.gold_earned::numeric / rm.max_gold)
        + 0.45 * least(1.0, rs.cs_per_min / rm.max_cs_per_min)
      ) AS pillar_e,
      (
        0.30 * least(1.0, rs.vision_per_min / mm.max_vpm)
        + 0.25 * least(1.0, rs.cc_time::numeric / mm.max_cc)
        + 0.30 * least(1.0, greatest(rs.taken_share, rs.mitig_share) / mm.max_tank)
        + 0.15 * least(1.0, rs.objectives / mm.max_obj)
      ) AS pillar_u
    FROM raw_stats rs
    CROSS JOIN match_max mm
    JOIN role_max rm ON rm.role_bucket = rs.role_bucket
  ),
  -- Full four-pillar role weights: C, E, U plus T = 0.23 for all roles.
  weighted AS (
    SELECT
      p.puuid,
      p.participant_id,
      p.win,
      p.role_bucket,
      p.dmg_share,
      p.vision_per_min,
      p.pillar_c,
      p.pillar_e,
      p.pillar_u,
      coalesce(tp.pillar_t, 0) AS pillar_t,
      CASE p.role_bucket
        WHEN 'CARRY'   THEN 0.40
        WHEN 'MID'     THEN 0.40
        WHEN 'TOP'     THEN 0.33
        WHEN 'JUNGLE'  THEN 0.33
        WHEN 'SUPPORT' THEN 0.25
        ELSE                0.35
      END AS w_c,
      CASE p.role_bucket
        WHEN 'CARRY'   THEN 0.27
        WHEN 'MID'     THEN 0.25
        WHEN 'TOP'     THEN 0.25
        WHEN 'JUNGLE'  THEN 0.22
        WHEN 'SUPPORT' THEN 0.12
        ELSE                0.25
      END AS w_e,
      CASE p.role_bucket
        WHEN 'CARRY'   THEN 0.10
        WHEN 'MID'     THEN 0.12
        WHEN 'TOP'     THEN 0.19
        WHEN 'JUNGLE'  THEN 0.22
        WHEN 'SUPPORT' THEN 0.40
        ELSE                0.17
      END AS w_u,
      0.23::numeric AS w_t
    FROM pillars p
    LEFT JOIN timeline_pillar tp ON tp.participant_id = p.participant_id
  ),
  scored AS (
    SELECT
      puuid,
      participant_id,
      win,
      dmg_share,
      vision_per_min,
      pillar_c,
      pillar_u,
      w_c,
      w_u,
      round(
        (10.0 * (w_c * pillar_c + w_e * pillar_e + w_u * pillar_u + w_t * pillar_t))::numeric,
        3
      ) AS op_score,
      (w_c * pillar_c + w_u * pillar_u) AS impact
    FROM weighted
  ),
  ranked AS (
    SELECT s.*,
      row_number() OVER (
        PARTITION BY s.win
        ORDER BY
          s.op_score DESC,
          s.impact DESC,
          s.dmg_share DESC,
          s.vision_per_min DESC,
          s.participant_id ASC
      ) AS rn
    FROM scored s
  )
  UPDATE match_participants mp
  SET op_score = r.op_score,
      is_mvp = (mp.win = true AND r.rn = 1),
      is_ace = (mp.win = false AND r.rn = 1)
  FROM ranked r
  WHERE mp.match_id = p_match_id AND mp.puuid = r.puuid;
END;
$$;

-- 6. Backfill: re-apply OP score for ALL matches with 10 participants so every row reflects v2.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT match_id
    FROM match_participants
    GROUP BY match_id
    HAVING count(*) = 10
  LOOP
    PERFORM compute_op_scores_for_match(r.match_id);
  END LOOP;
END;
$$;

-- 7. Full ratings backfill (reset + chronological replay).
--    apply_rating_update_for_match consumes op_score in its performance blend
--    (rating = base + K * (scaled_actual - expected_score), where actual is part
--    win/loss, part op_score), so changing every historical op_score invalidates
--    the entire rating progression. The only correct fix is to reset and replay
--    every match in game_creation order, identical in shape to the precedent in
--    20260220130000_rating_performance_single_column.sql.
UPDATE ratings
SET
  rating = 1000,
  wins = 0,
  losses = 0,
  avg_kills = NULL,
  avg_deaths = NULL,
  avg_assists = NULL,
  avg_cs = NULL,
  avg_kda = NULL,
  mvp_games = 0,
  ace_games = 0,
  total_penta_kills = 0,
  total_quadra_kills = 0,
  total_triple_kills = 0,
  avg_vision_score = NULL,
  avg_damage_to_champions = NULL,
  avg_gold_earned = NULL,
  avg_damage_taken = NULL,
  avg_heal = NULL,
  avg_cc_time = NULL,
  avg_turret_kills = NULL,
  avg_neutral_minions = NULL,
  avg_op_score = NULL,
  avg_gold_spent = NULL,
  avg_champ_level = NULL,
  win_streak = NULL,
  lose_streak = NULL,
  best_streak = NULL,
  updated_at = now();

DELETE FROM rating_history;

INSERT INTO ratings (puuid)
SELECT DISTINCT puuid FROM match_participants
ON CONFLICT (puuid) DO NOTHING;

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT m.match_id
    FROM matches m
    INNER JOIN (
      SELECT match_id
      FROM match_participants
      GROUP BY match_id
      HAVING count(*) = 10
    ) t ON t.match_id = m.match_id
    ORDER BY m.game_creation ASC
  LOOP
    PERFORM apply_rating_update_for_match(rec.match_id);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION "public"."compute_op_scores_for_match"(bigint) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."compute_op_scores_for_match"(bigint) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."compute_op_scores_for_match"(bigint) TO "service_role";
