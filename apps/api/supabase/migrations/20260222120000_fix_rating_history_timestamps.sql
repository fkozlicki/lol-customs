-- Fix rating_history.created_at: set it to the actual game_creation timestamp
-- instead of the time the record was inserted (which was the same for all rows
-- created during the backfill migration).

-- Step 1: backfill existing rows
UPDATE rating_history rh
SET created_at = m.game_creation
FROM matches m
WHERE rh.match_id = m.match_id;

-- Step 2: replace the function so future inserts also carry the correct timestamp
CREATE OR REPLACE FUNCTION "public"."apply_rating_update_for_match"(p_match_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec record;
BEGIN
  IF (SELECT count(*) FROM match_participants WHERE match_id = p_match_id) < 10 THEN
    RETURN;
  END IF;

  INSERT INTO ratings (puuid)
  SELECT DISTINCT puuid FROM match_participants WHERE match_id = p_match_id
  ON CONFLICT DO NOTHING;

  WITH team_data AS (
    SELECT
      mp.team_id,
      avg(r.rating) AS avg_rating,
      bool_or(mp.win) AS win
    FROM match_participants mp
    JOIN ratings r USING (puuid)
    WHERE mp.match_id = p_match_id
    GROUP BY mp.team_id
  ),
  expected AS (
    SELECT
      t1.team_id,
      1.0 / (1 + power(10, (t2.avg_rating - t1.avg_rating) / 400.0)) AS expected_score
    FROM team_data t1
    JOIN team_data t2 ON t1.team_id <> t2.team_id
  ),
  per_player AS (
    SELECT
      mp.puuid,
      mp.team_id,
      mp.win,
      CASE
        WHEN mp.op_score IS NULL THEN (CASE WHEN mp.win THEN 1.0 ELSE 0.0 END)
        ELSE 0.65 * (CASE WHEN mp.win THEN 1.0 ELSE 0.0 END)
             + 0.35 * (least(10.0, greatest(0.0, coalesce(mp.op_score, 0)::numeric)) / 10.0)
      END AS actual
    FROM match_participants mp
    WHERE mp.match_id = p_match_id
  ),
  total_actual AS (
    SELECT sum(actual) AS total FROM per_player
  ),
  with_scaled AS (
    SELECT
      p.puuid,
      p.team_id,
      p.win,
      e.expected_score,
      CASE
        WHEN (SELECT total FROM total_actual) IS NULL OR (SELECT total FROM total_actual) = 0 THEN 0.5
        ELSE p.actual * (5.0 / (SELECT total FROM total_actual))
      END AS scaled_actual
    FROM per_player p
    JOIN expected e ON e.team_id = p.team_id
  )
  UPDATE ratings r
  SET
    rating = r.rating + round(least(24, greatest(-24, 32 * (w.scaled_actual - w.expected_score)))),
    wins = r.wins + CASE WHEN w.win THEN 1 ELSE 0 END,
    losses = r.losses + CASE WHEN w.win THEN 0 ELSE 1 END,
    avg_kills = (coalesce(r.avg_kills, 0) * (r.wins + r.losses) + coalesce(mp.kills, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_deaths = (coalesce(r.avg_deaths, 0) * (r.wins + r.losses) + coalesce(mp.deaths, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_assists = (coalesce(r.avg_assists, 0) * (r.wins + r.losses) + coalesce(mp.assists, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_cs = (coalesce(r.avg_cs, 0) * (r.wins + r.losses) + (coalesce(mp.total_minions_killed, 0) + coalesce(mp.neutral_minions_killed, 0))) / nullif(r.wins + r.losses + 1, 0),
    avg_kda = (coalesce(r.avg_kda, 0) * (r.wins + r.losses) + (coalesce(mp.kills, 0) + coalesce(mp.assists, 0))::numeric / greatest(coalesce(mp.deaths, 0), 1)) / nullif(r.wins + r.losses + 1, 0),
    mvp_games = r.mvp_games + CASE WHEN mp.is_mvp THEN 1 ELSE 0 END,
    ace_games = r.ace_games + CASE WHEN mp.is_ace THEN 1 ELSE 0 END,
    total_penta_kills = r.total_penta_kills + coalesce(mp.penta_kills, 0),
    total_quadra_kills = r.total_quadra_kills + coalesce(mp.quadra_kills, 0),
    total_triple_kills = r.total_triple_kills + coalesce(mp.triple_kills, 0),
    avg_vision_score = (coalesce(r.avg_vision_score, 0) * (r.wins + r.losses) + coalesce(mp.vision_score, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_damage_to_champions = (coalesce(r.avg_damage_to_champions, 0) * (r.wins + r.losses) + coalesce(mp.total_damage_dealt_to_champions, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_gold_earned = (coalesce(r.avg_gold_earned, 0) * (r.wins + r.losses) + coalesce(mp.gold_earned, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_damage_taken = (coalesce(r.avg_damage_taken, 0) * (r.wins + r.losses) + coalesce(mp.total_damage_taken, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_heal = (coalesce(r.avg_heal, 0) * (r.wins + r.losses) + coalesce(mp.total_heal, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_cc_time = (coalesce(r.avg_cc_time, 0) * (r.wins + r.losses) + coalesce(mp.total_time_cc_dealt, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_turret_kills = (coalesce(r.avg_turret_kills, 0) * (r.wins + r.losses) + coalesce(mp.turret_kills, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_neutral_minions = (coalesce(r.avg_neutral_minions, 0) * (r.wins + r.losses) + coalesce(mp.neutral_minions_killed, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_op_score = (coalesce(r.avg_op_score, 0) * (r.wins + r.losses) + coalesce(mp.op_score, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_gold_spent = (coalesce(r.avg_gold_spent, 0) * (r.wins + r.losses) + coalesce(mp.gold_spent, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_champ_level = (coalesce(r.avg_champ_level, 0) * (r.wins + r.losses) + coalesce(mp.champ_level, 0)) / nullif(r.wins + r.losses + 1, 0),
    updated_at = now()
  FROM with_scaled w
  JOIN match_participants mp ON mp.puuid = w.puuid AND mp.match_id = p_match_id
  WHERE r.puuid = w.puuid;

  FOR rec IN
    SELECT mp.puuid FROM match_participants mp WHERE match_id = p_match_id
  LOOP
    UPDATE ratings r
    SET
      win_streak = s.win_streak,
      lose_streak = s.lose_streak,
      best_streak = s.best_streak
    FROM compute_player_streaks(rec.puuid) AS s
    WHERE r.puuid = rec.puuid;
  END LOOP;

  INSERT INTO rating_history (puuid, match_id, rating_after, created_at)
  SELECT puuid, p_match_id, rating,
         (SELECT game_creation FROM matches WHERE match_id = p_match_id)
  FROM ratings
  WHERE puuid IN (SELECT puuid FROM match_participants WHERE match_id = p_match_id);
END;
$$;
