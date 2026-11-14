-- `leaderboard_at` becomes `standings_at`: CONTEXT.md says Standings and lists Leaderboard as a word to
-- avoid.
--
-- The app deployed before this change calls `leaderboard_at`, and the one after it calls
-- `standings_at`, so `leaderboard_at` stays for now as a wrapper around `standings_at`. Drop it in a
-- migration after the app that calls `standings_at` is live.

create function public.standings_at(p_at timestamp with time zone, p_track integer, p_limit integer DEFAULT 50)
 RETURNS TABLE(puuid text, rating integer, wins integer, losses integer, best_streak integer, win_streak integer, lose_streak integer, updated_at timestamp with time zone, avg_kills numeric, avg_deaths numeric, avg_assists numeric, mvp_games integer, ace_games integer, game_name text, tag_line text, profile_icon integer, platform_id text, qualified boolean)
 LANGUAGE sql
 STABLE
AS $function$
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
$function$;

grant execute on function public.standings_at(timestamp with time zone, integer, integer)
  to anon, authenticated, service_role;

create or replace function public.standings_after_match(p_track integer, p_matches integer, p_limit integer DEFAULT 50)
 RETURNS TABLE(puuid text, rating integer, wins integer, losses integer, best_streak integer, win_streak integer, lose_streak integer, updated_at timestamp with time zone, avg_kills numeric, avg_deaths numeric, avg_assists numeric, mvp_games integer, ace_games integer, game_name text, tag_line text, profile_icon integer, platform_id text, qualified boolean)
 LANGUAGE sql
 STABLE
AS $function$
  select *
  from public.standings_at(
    (
      select max(rh.created_at)
      from public.rating_history rh
      where rh.ladder_season_id = p_track
        and rh.match_id = (
          select m.match_id
          from public.matches m
          where p_track = 0 or m.ladder_season_id = p_track
          order by m.game_creation, m.match_id
          offset greatest(p_matches, 1) - 1
          limit 1
        )
    ),
    p_track,
    p_limit
  );
$function$;

-- Deprecated: kept until the app calling `standings_at` is deployed.
create or replace function public.leaderboard_at(p_at timestamp with time zone, p_track integer, p_limit integer DEFAULT 50)
 RETURNS TABLE(puuid text, rating integer, wins integer, losses integer, best_streak integer, win_streak integer, lose_streak integer, updated_at timestamp with time zone, avg_kills numeric, avg_deaths numeric, avg_assists numeric, mvp_games integer, ace_games integer, game_name text, tag_line text, profile_icon integer, platform_id text, qualified boolean)
 LANGUAGE sql
 STABLE
AS $function$
  select * from public.standings_at(p_at, p_track, p_limit);
$function$;
