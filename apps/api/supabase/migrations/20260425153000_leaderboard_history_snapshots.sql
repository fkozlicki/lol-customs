-- Historical leaderboard snapshots:
-- - keep ratings as the live cache
-- - extend rating_history so point-in-time leaderboard queries are cheap and exact

ALTER TABLE "public"."rating_history"
  ADD COLUMN IF NOT EXISTS "wins" integer,
  ADD COLUMN IF NOT EXISTS "losses" integer,
  ADD COLUMN IF NOT EXISTS "best_streak" integer,
  ADD COLUMN IF NOT EXISTS "win_streak" integer,
  ADD COLUMN IF NOT EXISTS "lose_streak" integer,
  ADD COLUMN IF NOT EXISTS "avg_kills" numeric,
  ADD COLUMN IF NOT EXISTS "avg_deaths" numeric,
  ADD COLUMN IF NOT EXISTS "avg_assists" numeric,
  ADD COLUMN IF NOT EXISTS "mvp_games" integer,
  ADD COLUMN IF NOT EXISTS "ace_games" integer;

CREATE INDEX IF NOT EXISTS "idx_rating_history_puuid_created_match"
  ON "public"."rating_history" ("puuid", "created_at" DESC, "match_id" DESC);

CREATE INDEX IF NOT EXISTS "idx_rating_history_created_at"
  ON "public"."rating_history" ("created_at" DESC);

CREATE OR REPLACE FUNCTION "public"."leaderboard_at"(
  p_at timestamptz,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  puuid text,
  rating integer,
  wins integer,
  losses integer,
  best_streak integer,
  win_streak integer,
  lose_streak integer,
  updated_at timestamptz,
  avg_kills numeric,
  avg_deaths numeric,
  avg_assists numeric,
  mvp_games integer,
  ace_games integer,
  game_name text,
  tag_line text,
  profile_icon integer,
  platform_id text
)
LANGUAGE sql
STABLE
AS $$
  WITH latest AS (
    SELECT DISTINCT ON (rh.puuid)
      rh.puuid,
      rh.rating_after AS rating,
      coalesce(rh.wins, 0) AS wins,
      coalesce(rh.losses, 0) AS losses,
      rh.best_streak,
      rh.win_streak,
      rh.lose_streak,
      rh.created_at AS updated_at,
      rh.avg_kills,
      rh.avg_deaths,
      rh.avg_assists,
      coalesce(rh.mvp_games, 0) AS mvp_games,
      coalesce(rh.ace_games, 0) AS ace_games
    FROM rating_history rh
    WHERE rh.created_at <= p_at
    ORDER BY rh.puuid, rh.created_at DESC, rh.match_id DESC
  )
  SELECT
    l.puuid,
    l.rating,
    l.wins,
    l.losses,
    l.best_streak,
    l.win_streak,
    l.lose_streak,
    l.updated_at,
    l.avg_kills,
    l.avg_deaths,
    l.avg_assists,
    l.mvp_games,
    l.ace_games,
    p.game_name,
    p.tag_line,
    p.profile_icon,
    p.platform_id
  FROM latest l
  LEFT JOIN players p ON p.puuid = l.puuid
  ORDER BY l.rating DESC NULLS LAST, l.puuid ASC
  LIMIT greatest(1, least(coalesce(p_limit, 50), 200));
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
    FROM compute_player_streaks(rec.puuid) AS s
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

-- Rebuild history snapshots so existing rows include the newly added snapshot columns.
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

GRANT EXECUTE ON FUNCTION "public"."leaderboard_at"(timestamptz, int) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."leaderboard_at"(timestamptz, int) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."leaderboard_at"(timestamptz, int) TO "service_role";
