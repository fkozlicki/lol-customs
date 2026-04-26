-- OP score: SR 5v5 slot-based role buckets (participant_id 1–10), combat/vision tuning,
-- deterministic MVP tie-breaks, and MVP op_score >= ACE. Recompute OP + replay ratings.

CREATE OR REPLACE FUNCTION "public"."_op_effective_role_bucket"(
  p_map_id integer,
  p_lobby_count bigint,
  p_participant_id integer,
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
    WHEN p_lobby_count = 10 AND coalesce(p_map_id, 0) <> 11 THEN 'UNKNOWN'::text
    WHEN p_lobby_count = 10 AND p_map_id = 11 THEN
      CASE p_participant_id
        WHEN 1 THEN 'TOP'
        WHEN 2 THEN 'JUNGLE'
        WHEN 3 THEN 'MID'
        WHEN 4 THEN 'CARRY'
        WHEN 5 THEN 'SUPPORT'
        WHEN 6 THEN 'TOP'
        WHEN 7 THEN 'JUNGLE'
        WHEN 8 THEN 'MID'
        WHEN 9 THEN 'CARRY'
        WHEN 10 THEN 'SUPPORT'
        ELSE "public"."_op_role_bucket"(p_role, p_lane, p_minions, p_neutral)
      END
    ELSE "public"."_op_role_bucket"(p_role, p_lane, p_minions, p_neutral)
  END;
$$;

GRANT EXECUTE ON FUNCTION "public"."_op_effective_role_bucket"(integer, bigint, integer, text, text, integer, integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."_op_effective_role_bucket"(integer, bigint, integer, text, text, integer, integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."_op_effective_role_bucket"(integer, bigint, integer, text, text, integer, integer) TO "service_role";

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

  WITH match_ctx AS (
    SELECT
      m.map_id,
      (SELECT count(*)::bigint FROM match_participants c WHERE c.match_id = p_match_id) AS lobby_count
    FROM matches m
    WHERE m.match_id = p_match_id
  ),
  participants AS (
    SELECT
      mp.puuid,
      mp.participant_id,
      mp.team_id,
      mp.win,
      "public"."_op_effective_role_bucket"(
        mc.map_id,
        mc.lobby_count,
        mp.participant_id::integer,
        mp.role,
        mp.lane,
        mp.total_minions_killed,
        mp.neutral_minions_killed
      ) AS role_bucket,
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
    CROSS JOIN match_ctx mc
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
      greatest(max(kills), 1) AS max_kills,
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
      rs.kills,
      (
        0.32 * least(1.0, rs.dmg_share / mm.max_dmg_share)
        + 0.28 * least(1.0, rs.kp)
        + 0.22 * least(1.0, rs.smart_kda / mm.max_smart_kda)
        + 0.18 * least(1.0, rs.kills::numeric / mm.max_kills)
      ) AS pillar_c,
      (
        0.55 * least(1.0, rs.gold_earned::numeric / rm.max_gold)
        + 0.45 * least(1.0, rs.cs_per_min / rm.max_cs_per_min)
      ) AS pillar_e,
      (
        0.38 * least(1.0, rs.vision_per_min / mm.max_vpm)
        + 0.22 * least(1.0, rs.cc_time::numeric / mm.max_cc)
        + 0.25 * least(1.0, greatest(rs.taken_share, rs.mitig_share) / mm.max_tank)
        + 0.15 * least(1.0, rs.objectives / mm.max_obj)
      ) AS pillar_u
    FROM raw_stats rs
    CROSS JOIN match_max mm
    JOIN role_max rm ON rm.role_bucket = rs.role_bucket
  ),
  weighted AS (
    SELECT
      p.*,
      CASE p.role_bucket
        WHEN 'CARRY'   THEN 0.54
        WHEN 'MID'     THEN 0.54
        WHEN 'TOP'     THEN 0.43
        WHEN 'JUNGLE'  THEN 0.43
        WHEN 'SUPPORT' THEN 0.32
        ELSE                0.46
      END AS w_c,
      CASE p.role_bucket
        WHEN 'CARRY'   THEN 0.33
        WHEN 'MID'     THEN 0.30
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
      kills,
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
          s.kills DESC,
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

  UPDATE match_participants mp
  SET op_score = round(
    greatest(
      mp.op_score,
      coalesce(
        (SELECT max(op_score) FROM match_participants WHERE match_id = p_match_id AND is_ace),
        mp.op_score
      )
    )::numeric,
    3
  )
  WHERE mp.match_id = p_match_id AND mp.is_mvp;
END;
$$;

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
  match_ctx AS (
    SELECT
      m.map_id,
      (SELECT count(*)::bigint FROM match_participants c WHERE c.match_id = p_match_id) AS lobby_count
    FROM matches m
    WHERE m.match_id = p_match_id
  ),
  participants AS (
    SELECT
      mp.participant_id,
      mp.team_id,
      mp.puuid,
      mp.win,
      "public"."_op_effective_role_bucket"(
        mc.map_id,
        mc.lobby_count,
        mp.participant_id::integer,
        mp.role,
        mp.lane,
        mp.total_minions_killed,
        mp.neutral_minions_killed
      ) AS role_bucket,
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
    CROSS JOIN match_ctx mc
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
      p.kills,
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
      greatest(max(kills), 1) AS max_kills,
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
      rs.kills,
      (
        0.32 * least(1.0, rs.dmg_share / mm.max_dmg_share)
        + 0.28 * least(1.0, rs.kp)
        + 0.22 * least(1.0, rs.smart_kda / mm.max_smart_kda)
        + 0.18 * least(1.0, rs.kills::numeric / mm.max_kills)
      ) AS pillar_c,
      (
        0.55 * least(1.0, rs.gold_earned::numeric / rm.max_gold)
        + 0.45 * least(1.0, rs.cs_per_min / rm.max_cs_per_min)
      ) AS pillar_e,
      (
        0.38 * least(1.0, rs.vision_per_min / mm.max_vpm)
        + 0.22 * least(1.0, rs.cc_time::numeric / mm.max_cc)
        + 0.25 * least(1.0, greatest(rs.taken_share, rs.mitig_share) / mm.max_tank)
        + 0.15 * least(1.0, rs.objectives / mm.max_obj)
      ) AS pillar_u
    FROM raw_stats rs
    CROSS JOIN match_max mm
    JOIN role_max rm ON rm.role_bucket = rs.role_bucket
  ),
  weighted AS (
    SELECT
      p.puuid,
      p.participant_id,
      p.win,
      p.role_bucket,
      p.dmg_share,
      p.vision_per_min,
      p.kills,
      p.pillar_c,
      p.pillar_e,
      p.pillar_u,
      coalesce(tp.pillar_t, 0) AS pillar_t,
      CASE p.role_bucket
        WHEN 'CARRY'   THEN 0.42
        WHEN 'MID'     THEN 0.42
        WHEN 'TOP'     THEN 0.33
        WHEN 'JUNGLE'  THEN 0.33
        WHEN 'SUPPORT' THEN 0.25
        ELSE                0.35
      END AS w_c,
      CASE p.role_bucket
        WHEN 'CARRY'   THEN 0.25
        WHEN 'MID'     THEN 0.23
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
      kills,
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
          s.kills DESC,
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

  UPDATE match_participants mp
  SET op_score = round(
    greatest(
      mp.op_score,
      coalesce(
        (SELECT max(op_score) FROM match_participants WHERE match_id = p_match_id AND is_ace),
        mp.op_score
      )
    )::numeric,
    3
  )
  WHERE mp.match_id = p_match_id AND mp.is_mvp;
END;
$$;

-- Recompute OP for all 10-player matches, then reset + replay ratings (op_score feeds apply_rating_update_for_match).

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
