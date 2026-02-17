-- Fix: "a column definition list is redundant for a function with OUT parameters" (42601)
-- compute_player_streaks() already returns TABLE(...); do not repeat column list in FROM.
CREATE OR REPLACE FUNCTION "public"."update_ratings_for_match"() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  match_id_var bigint;
  rec record;
BEGIN
  match_id_var := NEW.match_id;

  IF (SELECT count(*) FROM match_participants WHERE match_id = match_id_var) < 10 THEN
    RETURN null;
  END IF;

  IF EXISTS (SELECT 1 FROM rating_history WHERE match_id = match_id_var) THEN
    RETURN null;
  END IF;

  INSERT INTO ratings (puuid)
  SELECT DISTINCT puuid FROM match_participants WHERE match_id = match_id_var
  ON CONFLICT DO NOTHING;

  WITH team_data AS (
    SELECT
      mp.team_id,
      avg(r.rating) AS avg_rating,
      bool_or(mp.win) AS win
    FROM match_participants mp
    JOIN ratings r USING (puuid)
    WHERE mp.match_id = match_id_var
    GROUP BY mp.team_id
  ),
  expected AS (
    SELECT
      t1.team_id,
      1.0 / (1 + power(10, (t2.avg_rating - t1.avg_rating) / 400.0)) AS expected_score,
      t1.win
    FROM team_data t1
    JOIN team_data t2 ON t1.team_id <> t2.team_id
  )
  UPDATE ratings r
  SET
    rating = r.rating + round(32 * ((CASE WHEN e.win THEN 1 ELSE 0 END) - e.expected_score)),
    wins = r.wins + CASE WHEN mp.win THEN 1 ELSE 0 END,
    losses = r.losses + CASE WHEN mp.win THEN 0 ELSE 1 END,
    avg_kills = (coalesce(r.avg_kills, 0) * (r.wins + r.losses) + coalesce(mp.kills, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_deaths = (coalesce(r.avg_deaths, 0) * (r.wins + r.losses) + coalesce(mp.deaths, 0)) / nullif(r.wins + r.losses + 1, 0),
    avg_assists = (coalesce(r.avg_assists, 0) * (r.wins + r.losses) + coalesce(mp.assists, 0)) / nullif(r.wins + r.losses + 1, 0),
    updated_at = now()
  FROM match_participants mp
  JOIN expected e ON mp.team_id = e.team_id
  WHERE r.puuid = mp.puuid AND mp.match_id = match_id_var;

  UPDATE ratings
  SET effective_rating = (1000.0 * 10 + rating * (wins + losses)) / nullif(10 + wins + losses, 0)
  WHERE puuid IN (SELECT puuid FROM match_participants WHERE match_id = match_id_var);

  FOR rec IN
    SELECT mp.puuid
    FROM match_participants mp
    WHERE mp.match_id = match_id_var
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
  SELECT puuid, match_id_var, rating
  FROM ratings
  WHERE puuid IN (SELECT puuid FROM match_participants WHERE match_id = match_id_var);

  RETURN null;
END;
$$;
