-- OP Score: OP.GG-style timeline (every 5 min, role-fair) with fallback to end-of-game formula.
-- When timeline_json is present and has frames: compute score at 5, 10, 15, ... min with role-aware
-- normalization (CS, gold, XP within role); average snapshots; blend with end-of-game damage/vision.
-- When timeline missing: use existing end-of-game-only formula.
-- Backfill: re-apply for ALL matches with 10 participants.

CREATE OR REPLACE FUNCTION "public"."compute_op_scores_for_match"(p_match_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_duration_sec int;
  v_timeline jsonb;
  v_has_timeline boolean;
BEGIN
  SELECT duration, timeline_json
  INTO v_duration_sec, v_timeline
  FROM matches
  WHERE match_id = p_match_id;

  IF v_duration_sec IS NULL OR v_duration_sec <= 0 THEN
    RETURN;
  END IF;

  v_has_timeline := (
    v_timeline IS NOT NULL
    AND v_timeline != '{}'::jsonb
    AND jsonb_typeof(v_timeline->'frames') = 'array'
    AND jsonb_array_length(v_timeline->'frames') > 0
  );

  IF NOT v_has_timeline THEN
    -- Fallback: end-of-game-only formula (same as previous migration).
    PERFORM _compute_op_scores_fallback(p_match_id, v_duration_sec);
    RETURN;
  END IF;

  -- Timeline path: every-5-min snapshots with role-fair normalization, then blend with end-of-game.
  PERFORM _compute_op_scores_timeline(p_match_id, v_duration_sec, v_timeline);
END;
$$;

-- Fallback: current end-of-game formula (KDA, KP, damage, CS/min, vision).
CREATE OR REPLACE FUNCTION "public"."_compute_op_scores_fallback"(p_match_id bigint, v_duration_sec int)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
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
      coalesce(mp.total_minions_killed, 0) + coalesce(mp.neutral_minions_killed, 0) AS cs,
      coalesce(mp.vision_score, 0) AS vision
    FROM match_participants mp
    WHERE mp.match_id = p_match_id
  ),
  team_totals AS (
    SELECT team_id, sum(kills) AS team_kills, sum(dmg_dealt) AS team_dmg_dealt
    FROM stats
    GROUP BY team_id
  ),
  kp_and_dmg AS (
    SELECT
      s.puuid, s.participant_id, s.team_id, s.win,
      s.kills, s.deaths, s.assists, s.dmg_dealt, s.cs, s.vision,
      tt.team_kills, tt.team_dmg_dealt,
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
      k.puuid, k.participant_id, k.team_id, k.win,
      least(1.0, k.kda_ratio / b.max_kda) AS kda_norm,
      least(1.0, k.kp) AS kp_norm,
      least(1.0, (k.dmg_dealt::numeric / nullif(k.team_dmg_dealt, 0)) / b.max_dmg_share) AS dmg_norm,
      least(1.0, (k.cs::numeric / nullif(v_duration_sec / 60.0, 0)) / b.max_cs_per_min) AS cs_norm,
      least(1.0, k.vision::numeric / b.max_vision) AS vision_norm
    FROM kp_and_dmg k
    CROSS JOIN bounds b
  ),
  scored AS (
    SELECT puuid, participant_id, team_id, win,
      round((0.25 * kda_norm + 0.25 * kp_norm + 0.25 * dmg_norm + 0.15 * cs_norm + 0.10 * vision_norm)::numeric * 10, 1) AS op_score
    FROM normalized
  ),
  with_rank AS (
    SELECT s.puuid, s.op_score, s.win,
      row_number() OVER (PARTITION BY s.win ORDER BY s.op_score DESC) AS rn
    FROM scored s
  )
  UPDATE match_participants mp
  SET op_score = wr.op_score,
      is_mvp = (mp.win = true AND wr.rn = 1),
      is_ace = (mp.win = false AND wr.rn = 1)
  FROM with_rank wr
  WHERE mp.match_id = p_match_id AND mp.puuid = wr.puuid;
END;
$$;

-- Timeline path: 5-min snapshots, role-fair CS/gold/XP, blend with end-of-game damage/vision.
CREATE OR REPLACE FUNCTION "public"."_compute_op_scores_timeline"(p_match_id bigint, v_duration_sec int, v_timeline jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF v_duration_sec < 300 THEN
    PERFORM _compute_op_scores_fallback(p_match_id, v_duration_sec);
    RETURN;
  END IF;

  WITH
  targets AS (
    SELECT (n * 300)::bigint * 1000 AS target_ts
    FROM generate_series(1, v_duration_sec / 300) n
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
  mp AS (
    SELECT participant_id, team_id, puuid, win, role,
      coalesce(total_damage_dealt_to_champions, 0) AS dmg_dealt,
      coalesce(vision_score, 0) AS vision
    FROM match_participants
    WHERE match_id = p_match_id
  ),
  team_totals AS (
    SELECT team_id, sum(dmg_dealt) AS team_dmg_dealt
    FROM mp
    GROUP BY team_id
  ),
  frame_stats AS (
    SELECT
      b.target_ts,
      m.participant_id,
      m.team_id,
      m.role,
      m.puuid,
      m.win,
      coalesce((b.participant_frames->(m.participant_id::text))->>'totalGold', '0')::numeric AS gold,
      coalesce((b.participant_frames->(m.participant_id::text))->>'xp', '0')::numeric AS xp,
      (coalesce((b.participant_frames->(m.participant_id::text))->>'minionsKilled', '0')::numeric
       + coalesce((b.participant_frames->(m.participant_id::text))->>'jungleMinionsKilled', '0')::numeric) AS cs
    FROM best_frame b
    CROSS JOIN mp m
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
  kda_at_ts AS (
    SELECT
      fs.target_ts,
      fs.participant_id,
      fs.team_id,
      fs.role,
      fs.puuid,
      fs.win,
      fs.gold,
      fs.xp,
      fs.cs,
      (SELECT count(*) FROM kill_events k WHERE k.participant_id = fs.participant_id AND k.event_ts <= fs.target_ts) AS kills,
      (SELECT count(*) FROM death_events d WHERE d.participant_id = fs.participant_id AND d.event_ts <= fs.target_ts) AS deaths,
      (SELECT count(*) FROM assist_events a WHERE a.participant_id = fs.participant_id AND a.event_ts <= fs.target_ts) AS assists,
      (SELECT count(*) FROM kill_events k JOIN mp m2 ON m2.participant_id = k.participant_id WHERE m2.team_id = fs.team_id AND k.event_ts <= fs.target_ts) AS team_kills_cumul
    FROM frame_stats fs
  ),
  kda_norms AS (
    SELECT
      target_ts,
      participant_id,
      role,
      puuid,
      win,
      gold,
      xp,
      cs,
      least(1.0, (kills + assists)::numeric / greatest(deaths, 1)) AS kda_ratio,
      CASE WHEN team_kills_cumul > 0 THEN least(1.0, (kills + assists)::numeric / team_kills_cumul) ELSE 0 END AS kp
    FROM kda_at_ts
  ),
  role_max_at_ts AS (
    SELECT target_ts, coalesce(role, '') AS role_key,
      greatest(max(gold), 1) AS max_gold,
      greatest(max(xp), 1) AS max_xp,
      greatest(max(cs), 1) AS max_cs
    FROM kda_norms
    GROUP BY target_ts, coalesce(role, '')
  ),
  global_kda_max AS (
    SELECT target_ts, greatest(max(kda_ratio), 0.01) AS max_kda, greatest(max(kp), 0.01) AS max_kp
    FROM kda_norms
    GROUP BY target_ts
  ),
  snapshot_norms AS (
    SELECT
      k.participant_id,
      k.puuid,
      k.win,
      k.target_ts,
      least(1.0, k.gold / r.max_gold) AS gold_norm,
      least(1.0, k.xp / r.max_xp) AS xp_norm,
      least(1.0, k.cs / r.max_cs) AS cs_norm,
      least(1.0, k.kda_ratio / g.max_kda) AS kda_norm,
      least(1.0, k.kp / g.max_kp) AS kp_norm
    FROM kda_norms k
    JOIN role_max_at_ts r ON r.target_ts = k.target_ts AND r.role_key = coalesce(k.role, '')
    JOIN global_kda_max g ON g.target_ts = k.target_ts
  ),
  timeline_avg AS (
    SELECT
      participant_id,
      puuid,
      win,
      (sum(gold_norm + xp_norm + cs_norm + kda_norm + kp_norm) / (5.0 * count(*))) AS timeline_score
    FROM snapshot_norms
    GROUP BY participant_id, puuid, win
  ),
  eog_bounds AS (
    SELECT
      greatest(max(m.dmg_dealt::numeric / nullif(tt.team_dmg_dealt, 0)), 0.01) AS max_dmg,
      greatest(max(m.vision), 1) AS max_vision
    FROM mp m
    JOIN team_totals tt ON tt.team_id = m.team_id
  ),
  final_scores AS (
    SELECT
      t.participant_id,
      t.puuid,
      t.win,
      t.timeline_score,
      least(1.0, (m.dmg_dealt::numeric / nullif(tt.team_dmg_dealt, 0)) / b.max_dmg) AS dmg_norm,
      least(1.0, m.vision::numeric / b.max_vision) AS vision_norm
    FROM timeline_avg t
    JOIN mp m ON m.participant_id = t.participant_id
    JOIN team_totals tt ON tt.team_id = m.team_id
    CROSS JOIN eog_bounds b
  ),
  scored AS (
    SELECT
      puuid,
      participant_id,
      win,
      round((0.75 * timeline_score + 0.15 * dmg_norm + 0.10 * vision_norm)::numeric * 10, 1) AS op_score
    FROM final_scores
  ),
  with_rank AS (
    SELECT puuid, op_score, win,
      row_number() OVER (PARTITION BY win ORDER BY op_score DESC) AS rn
    FROM scored
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

-- Backfill: re-apply OP score for ALL matches with 10 participants (so every match_participant gets new calculation).
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

GRANT EXECUTE ON FUNCTION "public"."compute_op_scores_for_match"(bigint) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."compute_op_scores_for_match"(bigint) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."compute_op_scores_for_match"(bigint) TO "service_role";
