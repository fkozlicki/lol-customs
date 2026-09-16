-- Qualified players and rating changes.
--
-- A player is qualified on a rating track after five matches on it. Only qualified players hold a
-- position in the standings and appear in Hall of Fame and Rivalry; the rest are still qualifying.
-- Rating changes are derived from rating_history instead of being stored.

CREATE OR REPLACE FUNCTION "public"."is_qualified"(p_wins integer, p_losses integer)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(p_wins, 0) + coalesce(p_losses, 0) >= 5;
$$;

ALTER TABLE "public"."ratings"
  ADD COLUMN "matches_played" integer
    GENERATED ALWAYS AS (coalesce("wins", 0) + coalesce("losses", 0)) STORED,
  ADD COLUMN "qualified" boolean
    GENERATED ALWAYS AS ("public"."is_qualified"("wins", "losses")) STORED;

CREATE INDEX IF NOT EXISTS "idx_ratings_track_qualified_rating"
  ON "public"."ratings" ("ladder_season_id", "qualified", "rating" DESC);

-- Point-in-time leaderboard: qualified players first, then players still qualifying.
DROP FUNCTION IF EXISTS "public"."leaderboard_at"(timestamptz, integer, int);

CREATE FUNCTION "public"."leaderboard_at"(
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
  platform_id text,
  qualified boolean
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
    p.platform_id,
    public.is_qualified(l.wins, l.losses) AS qualified
  FROM latest l
  LEFT JOIN players p ON p.puuid = l.puuid
  ORDER BY
    public.is_qualified(l.wins, l.losses) DESC,
    CASE WHEN public.is_qualified(l.wins, l.losses) THEN l.rating END DESC NULLS LAST,
    l.wins + l.losses DESC,
    l.rating DESC NULLS LAST,
    l.puuid ASC
  LIMIT greatest(1, least(coalesce(p_limit, 50), 200));
$$;

GRANT EXECUTE ON FUNCTION "public"."leaderboard_at"(timestamptz, integer, int) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."leaderboard_at"(timestamptz, integer, int) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."leaderboard_at"(timestamptz, integer, int) TO "service_role";

-- Position in the standings of a track; null while the player is still qualifying.
CREATE OR REPLACE FUNCTION "public"."standings_position"(p_puuid text, p_track integer)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT CASE WHEN me.qualified THEN (
    SELECT 1 + count(*)::integer
    FROM ratings r
    WHERE r.ladder_season_id = p_track
      AND r.qualified
      AND r.rating > me.rating
  ) END
  FROM ratings me
  WHERE me.ladder_season_id = p_track
    AND me.puuid = p_puuid;
$$;

GRANT EXECUTE ON FUNCTION "public"."standings_position"(text, integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."standings_position"(text, integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."standings_position"(text, integer) TO "service_role";

-- Rating change per participant for the given matches on one track. Snapshots are matched by the
-- number of matches played rather than by time, so late uploads compare against the rating they were
-- actually applied to.
CREATE OR REPLACE FUNCTION "public"."rating_changes"(p_match_ids bigint[], p_track integer)
RETURNS TABLE (
  match_id bigint,
  puuid text,
  rating_change integer
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    rh.match_id,
    rh.puuid,
    rh.rating_after - CASE
      WHEN coalesce(rh.wins, 0) + coalesce(rh.losses, 0) = 1 THEN 1000
      ELSE prev.rating_after
    END AS rating_change
  FROM rating_history rh
  LEFT JOIN rating_history prev
    ON prev.ladder_season_id = rh.ladder_season_id
    AND prev.puuid = rh.puuid
    AND coalesce(prev.wins, 0) + coalesce(prev.losses, 0)
      = coalesce(rh.wins, 0) + coalesce(rh.losses, 0) - 1
  WHERE rh.ladder_season_id = p_track
    AND rh.match_id = ANY (p_match_ids);
$$;

GRANT EXECUTE ON FUNCTION "public"."rating_changes"(bigint[], integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."rating_changes"(bigint[], integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."rating_changes"(bigint[], integer) TO "service_role";
