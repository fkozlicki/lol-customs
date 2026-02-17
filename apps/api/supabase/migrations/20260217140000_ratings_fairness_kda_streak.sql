-- 1. Add average KDA and effective_rating columns to ratings
ALTER TABLE "public"."ratings"
  ADD COLUMN IF NOT EXISTS "avg_kills" numeric,
  ADD COLUMN IF NOT EXISTS "avg_deaths" numeric,
  ADD COLUMN IF NOT EXISTS "avg_assists" numeric,
  ADD COLUMN IF NOT EXISTS "effective_rating" numeric;

-- 2. Function to compute current win/lose streak and best streak from match history (by game_creation)
--    so streak is correct regardless of insert order.
CREATE OR REPLACE FUNCTION "public"."compute_player_streaks"(p_puuid text)
RETURNS TABLE(win_streak int, lose_streak int, best_streak int)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_win_streak int := 0;
  v_lose_streak int := 0;
  v_best_streak int := 0;
  v_current_win_streak int := 0;
  v_win boolean;
  v_prev_win boolean := null;
BEGIN
  -- Current win/lose streak: count consecutive same outcome from most recent match
  FOR v_win IN
    SELECT mp.win
    FROM match_participants mp
    JOIN matches m ON m.match_id = mp.match_id
    WHERE mp.puuid = p_puuid
    ORDER BY m.game_creation DESC
  LOOP
    IF v_prev_win IS NULL THEN
      v_prev_win := v_win;
      IF v_win THEN v_win_streak := 1; ELSE v_lose_streak := 1; END IF;
    ELSIF v_win = v_prev_win THEN
      IF v_win THEN v_win_streak := v_win_streak + 1; ELSE v_lose_streak := v_lose_streak + 1; END IF;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Best streak: scan all matches in chronological order and track max consecutive wins
  v_current_win_streak := 0;
  FOR v_win IN
    SELECT mp.win
    FROM match_participants mp
    JOIN matches m ON m.match_id = mp.match_id
    WHERE mp.puuid = p_puuid
    ORDER BY m.game_creation ASC
  LOOP
    IF v_win THEN
      v_current_win_streak := v_current_win_streak + 1;
      v_best_streak := greatest(v_best_streak, v_current_win_streak);
    ELSE
      v_current_win_streak := 0;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_win_streak, v_lose_streak, v_best_streak;
END;
$$;

-- 3. Replace trigger to use computed streaks and update average KDA
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

  -- Update rating, wins, losses, KDA (and later streaks)
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

  -- Update effective_rating (fair ranking: prior 1000, prior_games 10)
  UPDATE ratings
  SET effective_rating = (1000.0 * 10 + rating * (wins + losses)) / nullif(10 + wins + losses, 0)
  WHERE puuid IN (SELECT puuid FROM match_participants WHERE match_id = match_id_var);

  -- Set streaks from match history (chronological order), so insert order doesn't matter
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
    FROM compute_player_streaks(rec.puuid) AS s(win_streak int, lose_streak int, best_streak int)
    WHERE r.puuid = rec.puuid;
  END LOOP;

  INSERT INTO rating_history (puuid, match_id, rating_after)
  SELECT puuid, match_id_var, rating
  FROM ratings
  WHERE puuid IN (SELECT puuid FROM match_participants WHERE match_id = match_id_var);

  RETURN null;
END;
$$;

-- 4. Backfill: recompute streaks for all existing ratings (by chronological match order)
DO $$
DECLARE
  rec record;
  s record;
BEGIN
  FOR rec IN SELECT puuid FROM ratings
  LOOP
    SELECT * INTO s FROM compute_player_streaks(rec.puuid) LIMIT 1;
    UPDATE ratings SET win_streak = s.win_streak, lose_streak = s.lose_streak, best_streak = s.best_streak WHERE puuid = rec.puuid;
  END LOOP;
END;
$$;

-- Backfill average KDA from match_participants
UPDATE ratings r
SET
  avg_kills = s.avg_k,
  avg_deaths = s.avg_d,
  avg_assists = s.avg_a
FROM (
  SELECT
    puuid,
    avg(kills) AS avg_k,
    avg(deaths) AS avg_d,
    avg(assists) AS avg_a
  FROM match_participants
  GROUP BY puuid
) s
WHERE r.puuid = s.puuid;

-- 5. Backfill effective_rating (fair ranking: prior 1000, prior_games 10)
UPDATE ratings
SET effective_rating = (1000.0 * 10 + rating * (wins + losses)) / nullif(10 + wins + losses, 0)
WHERE rating IS NOT NULL;

GRANT EXECUTE ON FUNCTION "public"."compute_player_streaks"(text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."compute_player_streaks"(text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."compute_player_streaks"(text) TO "service_role";

-- Remove view if it was created by a previous run of this migration
DROP VIEW IF EXISTS "public"."leaderboard_ranked";
