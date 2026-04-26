-- Streaks: compute only through the match being applied (fixes replay / historical leaderboard).
-- Replaces one-arg compute_player_streaks; replays ratings + rating_history.

CREATE OR REPLACE FUNCTION "public"."compute_player_streaks"(
  p_puuid text,
  p_through_match_id bigint
)
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
  v_cap_gc timestamptz;
  v_cap_mid bigint;
BEGIN
  SELECT m.game_creation, m.match_id
  INTO v_cap_gc, v_cap_mid
  FROM matches m
  WHERE m.match_id = p_through_match_id;

  IF v_cap_mid IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0;
    RETURN;
  END IF;

  FOR v_win IN
    SELECT mp.win
    FROM match_participants mp
    JOIN matches m ON m.match_id = mp.match_id
    WHERE mp.puuid = p_puuid
      AND (m.game_creation, m.match_id) <= (v_cap_gc, v_cap_mid)
    ORDER BY m.game_creation DESC, m.match_id DESC
  LOOP
    IF v_prev_win IS NULL THEN
      v_prev_win := v_win;
      IF v_win THEN
        v_win_streak := 1;
      ELSE
        v_lose_streak := 1;
      END IF;
    ELSIF v_win = v_prev_win THEN
      IF v_win THEN
        v_win_streak := v_win_streak + 1;
      ELSE
        v_lose_streak := v_lose_streak + 1;
      END IF;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  v_current_win_streak := 0;
  FOR v_win IN
    SELECT mp.win
    FROM match_participants mp
    JOIN matches m ON m.match_id = mp.match_id
    WHERE mp.puuid = p_puuid
      AND (m.game_creation, m.match_id) <= (v_cap_gc, v_cap_mid)
    ORDER BY m.game_creation ASC, m.match_id ASC
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
    FROM compute_player_streaks(rec.puuid, p_match_id) AS s
    WHERE r.puuid = rec.puuid;
  END LOOP;

  INSERT INTO rating_history (
    puuid,
    match_id,
    rating_after,
    created_at,
    wins,
    losses,
    best_streak,
    win_streak,
    lose_streak,
    avg_kills,
    avg_deaths,
    avg_assists,
    mvp_games,
    ace_games
  )
  SELECT
    r.puuid,
    p_match_id,
    r.rating,
    (SELECT game_creation FROM matches WHERE match_id = p_match_id),
    r.wins,
    r.losses,
    r.best_streak,
    r.win_streak,
    r.lose_streak,
    r.avg_kills,
    r.avg_deaths,
    r.avg_assists,
    r.mvp_games,
    r.ace_games
  FROM ratings r
  WHERE r.puuid IN (
    SELECT puuid FROM match_participants WHERE match_id = p_match_id
  );
END;
$$;

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
    FROM compute_player_streaks(rec.puuid, match_id_var) AS s
    WHERE r.puuid = rec.puuid;
  END LOOP;

  INSERT INTO rating_history (puuid, match_id, rating_after)
  SELECT puuid, match_id_var, rating
  FROM ratings
  WHERE puuid IN (SELECT puuid FROM match_participants WHERE match_id = match_id_var);

  RETURN null;
END;
$$;

DROP FUNCTION IF EXISTS "public"."compute_player_streaks"(text);

GRANT EXECUTE ON FUNCTION "public"."compute_player_streaks"(text, bigint) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."compute_player_streaks"(text, bigint) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."compute_player_streaks"(text, bigint) TO "service_role";

-- Rebuild rating_history streak columns (and aggregates) from corrected apply_rating_update_for_match.

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
    ORDER BY m.game_creation ASC, m.match_id ASC
  LOOP
    PERFORM apply_rating_update_for_match(rec.match_id);
  END LOOP;
END;
$$;
