-- Add avg_cs, avg_kda and Hall of Fame aggregates to ratings (from match_participants).
-- Counts: mvp_games, ace_games. Sums: total_penta_kills, total_quadra_kills, total_triple_kills.
-- Averages: vision, damage to champs, gold earned/spent, damage taken, heal, cc, turrets, neutral minions, op_score, champ_level.

ALTER TABLE "public"."ratings"
  ADD COLUMN IF NOT EXISTS "avg_cs" numeric,
  ADD COLUMN IF NOT EXISTS "avg_kda" numeric,
  ADD COLUMN IF NOT EXISTS "mvp_games" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ace_games" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_penta_kills" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_quadra_kills" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_triple_kills" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "avg_vision_score" numeric,
  ADD COLUMN IF NOT EXISTS "avg_damage_to_champions" numeric,
  ADD COLUMN IF NOT EXISTS "avg_gold_earned" numeric,
  ADD COLUMN IF NOT EXISTS "avg_damage_taken" numeric,
  ADD COLUMN IF NOT EXISTS "avg_heal" numeric,
  ADD COLUMN IF NOT EXISTS "avg_cc_time" numeric,
  ADD COLUMN IF NOT EXISTS "avg_turret_kills" numeric,
  ADD COLUMN IF NOT EXISTS "avg_neutral_minions" numeric,
  ADD COLUMN IF NOT EXISTS "avg_op_score" numeric,
  ADD COLUMN IF NOT EXISTS "avg_gold_spent" numeric,
  ADD COLUMN IF NOT EXISTS "avg_champ_level" numeric;

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

  INSERT INTO rating_history (puuid, match_id, rating_after)
  SELECT puuid, p_match_id, rating
  FROM ratings
  WHERE puuid IN (SELECT puuid FROM match_participants WHERE match_id = p_match_id);
END;
$$;

-- Backfill avg_cs, avg_kda and all HOF aggregates from match_participants.
UPDATE ratings r
SET
  avg_cs = s.avg_cs,
  avg_kda = s.avg_kda,
  mvp_games = s.mvp_games,
  ace_games = s.ace_games,
  total_penta_kills = s.total_penta_kills,
  total_quadra_kills = s.total_quadra_kills,
  total_triple_kills = s.total_triple_kills,
  avg_vision_score = s.avg_vision_score,
  avg_damage_to_champions = s.avg_damage_to_champions,
  avg_gold_earned = s.avg_gold_earned,
  avg_damage_taken = s.avg_damage_taken,
  avg_heal = s.avg_heal,
  avg_cc_time = s.avg_cc_time,
  avg_turret_kills = s.avg_turret_kills,
  avg_neutral_minions = s.avg_neutral_minions,
  avg_op_score = s.avg_op_score,
  avg_gold_spent = s.avg_gold_spent,
  avg_champ_level = s.avg_champ_level
FROM (
  SELECT
    puuid,
    avg(coalesce(total_minions_killed, 0)::numeric + coalesce(neutral_minions_killed, 0)::numeric) AS avg_cs,
    avg((coalesce(kills, 0) + coalesce(assists, 0))::numeric / greatest(coalesce(deaths, 0), 1)) AS avg_kda,
    count(*) FILTER (WHERE is_mvp)::integer AS mvp_games,
    count(*) FILTER (WHERE is_ace)::integer AS ace_games,
    coalesce(sum(penta_kills), 0)::integer AS total_penta_kills,
    coalesce(sum(quadra_kills), 0)::integer AS total_quadra_kills,
    coalesce(sum(triple_kills), 0)::integer AS total_triple_kills,
    avg(coalesce(vision_score, 0)) AS avg_vision_score,
    avg(coalesce(total_damage_dealt_to_champions, 0)) AS avg_damage_to_champions,
    avg(coalesce(gold_earned, 0)) AS avg_gold_earned,
    avg(coalesce(total_damage_taken, 0)) AS avg_damage_taken,
    avg(coalesce(total_heal, 0)) AS avg_heal,
    avg(coalesce(total_time_cc_dealt, 0)) AS avg_cc_time,
    avg(coalesce(turret_kills, 0)) AS avg_turret_kills,
    avg(coalesce(neutral_minions_killed, 0)) AS avg_neutral_minions,
    avg(coalesce(op_score, 0)) AS avg_op_score,
    avg(coalesce(gold_spent, 0)) AS avg_gold_spent,
    avg(coalesce(champ_level, 0)) AS avg_champ_level
  FROM match_participants
  GROUP BY puuid
) s
WHERE r.puuid = s.puuid;
