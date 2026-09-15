-- Ladder seasons.
-- - `seasons`: numbered ladder periods; a season lasts until the next one starts.
--   Not to be confused with Riot's `matches.season_id` (left untouched for LCU compatibility).
-- - `matches.ladder_season_id`: derived from `game_creation` by trigger (client value ignored).
-- - `ratings` / `rating_history` are keyed by rating track: `ladder_season_id = N` for season N
--   (hard reset to 1000 each season) and `ladder_season_id = 0` for the continuous all-time track.
-- Every existing game belongs to Season 1; Season 2 starts when this migration runs.

-- 1. Seasons -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."seasons" (
  "id" integer PRIMARY KEY CHECK ("id" > 0),
  "number" integer NOT NULL UNIQUE,
  "starts_at" timestamptz NOT NULL UNIQUE
);

ALTER TABLE "public"."seasons" OWNER TO "postgres";

GRANT SELECT ON TABLE "public"."seasons" TO "anon";
GRANT SELECT ON TABLE "public"."seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."seasons" TO "service_role";

INSERT INTO "public"."seasons" ("id", "number", "starts_at") VALUES
  (1, 1, '-infinity'),
  (2, 2, now());

CREATE OR REPLACE FUNCTION "public"."ladder_season_for"(p_at timestamptz)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT s.id
  FROM seasons s
  WHERE s.starts_at <= p_at
  ORDER BY s.starts_at DESC
  LIMIT 1;
$$;

-- 2. matches.ladder_season_id -------------------------------------------------

ALTER TABLE "public"."matches"
  ADD COLUMN IF NOT EXISTS "ladder_season_id" integer REFERENCES "public"."seasons"("id");

UPDATE "public"."matches" SET "ladder_season_id" = 1 WHERE "ladder_season_id" IS NULL;

ALTER TABLE "public"."matches" ALTER COLUMN "ladder_season_id" SET NOT NULL;
-- The trigger below is authoritative; the default only keeps the column optional for inserts
-- (LCU clients never send it).
ALTER TABLE "public"."matches" ALTER COLUMN "ladder_season_id" SET DEFAULT ladder_season_for(now());

CREATE INDEX IF NOT EXISTS "idx_matches_ladder_season_creation"
  ON "public"."matches" ("ladder_season_id", "game_creation" DESC, "match_id" DESC);

CREATE OR REPLACE FUNCTION "public"."trg_set_match_ladder_season"() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.ladder_season_id := ladder_season_for(NEW.game_creation);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trg_set_match_ladder_season" ON "public"."matches";
CREATE TRIGGER "trg_set_match_ladder_season"
  BEFORE INSERT OR UPDATE OF "game_creation", "ladder_season_id" ON "public"."matches"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."trg_set_match_ladder_season"();

-- 3. Rating tracks on ratings / rating_history -------------------------------

ALTER TABLE "public"."ratings"
  ADD COLUMN IF NOT EXISTS "ladder_season_id" integer NOT NULL DEFAULT 1;
ALTER TABLE "public"."ratings" ALTER COLUMN "ladder_season_id" DROP DEFAULT;
ALTER TABLE "public"."ratings"
  ADD CONSTRAINT "ratings_ladder_season_id_check" CHECK ("ladder_season_id" >= 0);

ALTER TABLE "public"."rating_history"
  ADD COLUMN IF NOT EXISTS "ladder_season_id" integer NOT NULL DEFAULT 1;
ALTER TABLE "public"."rating_history" ALTER COLUMN "ladder_season_id" DROP DEFAULT;
ALTER TABLE "public"."rating_history"
  ADD CONSTRAINT "rating_history_ladder_season_id_check" CHECK ("ladder_season_id" >= 0);

ALTER TABLE "public"."ratings" DROP CONSTRAINT "ratings_pkey";
ALTER TABLE "public"."ratings"
  ADD CONSTRAINT "ratings_pkey" PRIMARY KEY ("ladder_season_id", "puuid");

ALTER TABLE "public"."rating_history" DROP CONSTRAINT "rating_history_pkey";
ALTER TABLE "public"."rating_history"
  ADD CONSTRAINT "rating_history_pkey" PRIMARY KEY ("ladder_season_id", "puuid", "match_id");

-- All games so far are Season 1, so the all-time track is an exact copy of it.
INSERT INTO "public"."ratings" (
  ladder_season_id, puuid, rating, wins, losses, best_streak, updated_at, win_streak, lose_streak,
  avg_kills, avg_deaths, avg_assists, avg_cs, avg_kda, mvp_games, ace_games,
  total_penta_kills, total_quadra_kills, total_triple_kills, avg_vision_score,
  avg_damage_to_champions, avg_gold_earned, avg_damage_taken, avg_heal, avg_cc_time,
  avg_turret_kills, avg_neutral_minions, avg_op_score, avg_gold_spent, avg_champ_level
)
SELECT
  0, puuid, rating, wins, losses, best_streak, updated_at, win_streak, lose_streak,
  avg_kills, avg_deaths, avg_assists, avg_cs, avg_kda, mvp_games, ace_games,
  total_penta_kills, total_quadra_kills, total_triple_kills, avg_vision_score,
  avg_damage_to_champions, avg_gold_earned, avg_damage_taken, avg_heal, avg_cc_time,
  avg_turret_kills, avg_neutral_minions, avg_op_score, avg_gold_spent, avg_champ_level
FROM "public"."ratings"
WHERE ladder_season_id = 1;

INSERT INTO "public"."rating_history" (
  ladder_season_id, puuid, match_id, rating_after, created_at, wins, losses, best_streak,
  win_streak, lose_streak, avg_kills, avg_deaths, avg_assists, mvp_games, ace_games
)
SELECT
  0, puuid, match_id, rating_after, created_at, wins, losses, best_streak,
  win_streak, lose_streak, avg_kills, avg_deaths, avg_assists, mvp_games, ace_games
FROM "public"."rating_history"
WHERE ladder_season_id = 1;

DROP INDEX IF EXISTS "public"."idx_rating_history_puuid_created_match";
CREATE INDEX IF NOT EXISTS "idx_rating_history_track_puuid_created_match"
  ON "public"."rating_history" ("ladder_season_id", "puuid", "created_at" DESC, "match_id" DESC);

DROP INDEX IF EXISTS "public"."idx_rating_history_created_at";
CREATE INDEX IF NOT EXISTS "idx_rating_history_track_created_at"
  ON "public"."rating_history" ("ladder_season_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_rating_history_match"
  ON "public"."rating_history" ("match_id");

CREATE INDEX IF NOT EXISTS "idx_ratings_track_rating"
  ON "public"."ratings" ("ladder_season_id", "rating" DESC);

-- 4. Streaks scoped to a rating track ----------------------------------------

CREATE OR REPLACE FUNCTION "public"."compute_player_streaks"(
  p_puuid text,
  p_through_match_id bigint,
  p_track integer
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
      AND (p_track = 0 OR m.ladder_season_id = p_track)
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
      AND (p_track = 0 OR m.ladder_season_id = p_track)
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

DROP FUNCTION IF EXISTS "public"."compute_player_streaks"(text, bigint);

GRANT EXECUTE ON FUNCTION "public"."compute_player_streaks"(text, bigint, integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."compute_player_streaks"(text, bigint, integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."compute_player_streaks"(text, bigint, integer) TO "service_role";

-- 5. Rating update per track ---------------------------------------------------

CREATE OR REPLACE FUNCTION "public"."_apply_rating_update_for_track"(
  p_match_id bigint,
  p_track integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec record;
BEGIN
  INSERT INTO ratings (ladder_season_id, puuid)
  SELECT DISTINCT p_track, puuid FROM match_participants WHERE match_id = p_match_id
  ON CONFLICT DO NOTHING;

  WITH team_data AS (
    SELECT
      mp.team_id,
      avg(r.rating) AS avg_rating,
      bool_or(mp.win) AS win
    FROM match_participants mp
    JOIN ratings r ON r.puuid = mp.puuid AND r.ladder_season_id = p_track
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
  WHERE r.puuid = w.puuid
    AND r.ladder_season_id = p_track;

  FOR rec IN
    SELECT mp.puuid FROM match_participants mp WHERE match_id = p_match_id
  LOOP
    UPDATE ratings r
    SET
      win_streak = s.win_streak,
      lose_streak = s.lose_streak,
      best_streak = s.best_streak
    FROM compute_player_streaks(rec.puuid, p_match_id, p_track) AS s
    WHERE r.puuid = rec.puuid
      AND r.ladder_season_id = p_track;
  END LOOP;

  INSERT INTO rating_history (
    ladder_season_id,
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
    p_track,
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
  WHERE r.ladder_season_id = p_track
    AND r.puuid IN (
      SELECT puuid FROM match_participants WHERE match_id = p_match_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."apply_rating_update_for_match"(p_match_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_season integer;
BEGIN
  IF (SELECT count(*) FROM match_participants WHERE match_id = p_match_id) < 10 THEN
    RETURN;
  END IF;

  SELECT ladder_season_id INTO v_season FROM matches WHERE match_id = p_match_id;
  IF v_season IS NULL THEN
    RETURN;
  END IF;

  PERFORM _apply_rating_update_for_track(p_match_id, v_season);
  PERFORM _apply_rating_update_for_track(p_match_id, 0);
END;
$$;

-- 6. Point-in-time leaderboard per track -------------------------------------

DROP FUNCTION IF EXISTS "public"."leaderboard_at"(timestamptz, int);

CREATE OR REPLACE FUNCTION "public"."leaderboard_at"(
  p_at timestamptz,
  p_track integer,
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
    WHERE rh.ladder_season_id = p_track
      AND rh.created_at <= p_at
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

GRANT EXECUTE ON FUNCTION "public"."leaderboard_at"(timestamptz, integer, int) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."leaderboard_at"(timestamptz, integer, int) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."leaderboard_at"(timestamptz, integer, int) TO "service_role";
