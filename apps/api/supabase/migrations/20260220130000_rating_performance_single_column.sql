-- Rating: single column (rating only), performance-blended actual, zero-sum per match.
-- Constants: K=32, win_weight=0.65, scale=400. Change in function body if tuning.
-- apply_rating_update_for_match is callable for both trigger and backfill.

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
    updated_at = now()
  FROM with_scaled w
  JOIN match_participants mp ON mp.puuid = w.puuid AND mp.match_id = p_match_id
  WHERE r.puuid = w.puuid;

  FOR rec IN
    SELECT mp.puuid FROM match_participants mp WHERE mp.match_id = p_match_id
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

CREATE OR REPLACE FUNCTION "public"."update_ratings_for_match"() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  match_id_var bigint;
BEGIN
  match_id_var := NEW.match_id;

  IF (SELECT count(*) FROM match_participants WHERE match_id = match_id_var) < 10 THEN
    RETURN null;
  END IF;

  IF EXISTS (SELECT 1 FROM rating_history WHERE match_id = match_id_var) THEN
    RETURN null;
  END IF;

  PERFORM apply_rating_update_for_match(match_id_var);
  RETURN null;
END;
$$;

ALTER TABLE "public"."ratings" DROP COLUMN IF EXISTS "effective_rating";

-- Full backfill: reset all ratings, clear history, replay every match in chronological order.
UPDATE ratings
SET
  rating = 1000,
  wins = 0,
  losses = 0,
  avg_kills = NULL,
  avg_deaths = NULL,
  avg_assists = NULL,
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

GRANT EXECUTE ON FUNCTION "public"."apply_rating_update_for_match"(bigint) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."apply_rating_update_for_match"(bigint) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."apply_rating_update_for_match"(bigint) TO "service_role";
