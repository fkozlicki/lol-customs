-- Teammates and rivals of one player on a rating track, for the player profile.
--
-- Only qualified players are named as a teammate or rival. Head-to-head records are compared once two
-- players have met at least three times. One row per relation; a relation without a candidate is absent.

CREATE OR REPLACE FUNCTION "public"."player_relations"(p_puuid text, p_track integer)
RETURNS TABLE (
  relation text,
  other_puuid text,
  matches integer,
  wins integer,
  losses integer,
  kills integer
)
LANGUAGE sql
STABLE
AS $$
  WITH mine AS (
    SELECT mp.match_id, mp.team_id, mp.participant_id, coalesce(mp.win, false) AS won
    FROM match_participants mp
    JOIN matches m ON m.match_id = mp.match_id
    WHERE mp.puuid = p_puuid
      AND (p_track = 0 OR m.ladder_season_id = p_track)
  ),
  qualified AS (
    SELECT r.puuid
    FROM ratings r
    WHERE r.ladder_season_id = p_track
      AND r.qualified
      AND r.puuid <> p_puuid
  ),
  pairs AS (
    SELECT
      other.puuid,
      other.team_id = mine.team_id AS same_side,
      count(*)::integer AS matches,
      count(*) FILTER (WHERE mine.won)::integer AS wins,
      count(*) FILTER (WHERE NOT mine.won)::integer AS losses
    FROM mine
    JOIN match_participants other
      ON other.match_id = mine.match_id
      AND other.puuid <> p_puuid
    JOIN qualified q ON q.puuid = other.puuid
    GROUP BY other.puuid, other.team_id = mine.team_id
  ),
  kills_by_me AS (
    SELECT victim.puuid, count(*)::integer AS kills
    FROM mine
    JOIN match_kills k
      ON k.match_id = mine.match_id
      AND k.killer_participant_id = mine.participant_id
    JOIN match_participants victim
      ON victim.match_id = k.match_id
      AND victim.participant_id = k.victim_participant_id
    JOIN qualified q ON q.puuid = victim.puuid
    GROUP BY victim.puuid
  ),
  kills_on_me AS (
    SELECT killer.puuid, count(*)::integer AS kills
    FROM mine
    JOIN match_kills k
      ON k.match_id = mine.match_id
      AND k.victim_participant_id = mine.participant_id
    JOIN match_participants killer
      ON killer.match_id = k.match_id
      AND killer.participant_id = k.killer_participant_id
    JOIN qualified q ON q.puuid = killer.puuid
    GROUP BY killer.puuid
  )
  (
    SELECT 'most_matches_with', puuid, matches, wins, losses, NULL::integer
    FROM pairs WHERE same_side
    ORDER BY matches DESC, wins DESC, puuid
    LIMIT 1
  )
  UNION ALL
  (
    SELECT 'most_wins_with', puuid, matches, wins, losses, NULL::integer
    FROM pairs WHERE same_side AND wins > 0
    ORDER BY wins DESC, matches ASC, puuid
    LIMIT 1
  )
  UNION ALL
  (
    SELECT 'most_losses_with', puuid, matches, wins, losses, NULL::integer
    FROM pairs WHERE same_side AND losses > 0
    ORDER BY losses DESC, matches ASC, puuid
    LIMIT 1
  )
  UNION ALL
  (
    SELECT 'best_head_to_head', puuid, matches, wins, losses, NULL::integer
    FROM pairs WHERE NOT same_side AND matches >= 3
    ORDER BY wins::numeric / matches DESC, matches DESC, puuid
    LIMIT 1
  )
  UNION ALL
  (
    SELECT 'worst_head_to_head', puuid, matches, wins, losses, NULL::integer
    FROM pairs WHERE NOT same_side AND matches >= 3
    ORDER BY wins::numeric / matches ASC, matches DESC, puuid
    LIMIT 1
  )
  UNION ALL
  (
    SELECT 'most_killed', puuid, NULL::integer, NULL::integer, NULL::integer, kills
    FROM kills_by_me
    ORDER BY kills DESC, puuid
    LIMIT 1
  )
  UNION ALL
  (
    SELECT 'most_killed_by', puuid, NULL::integer, NULL::integer, NULL::integer, kills
    FROM kills_on_me
    ORDER BY kills DESC, puuid
    LIMIT 1
  );
$$;

GRANT EXECUTE ON FUNCTION "public"."player_relations"(text, integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."player_relations"(text, integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."player_relations"(text, integer) TO "service_role";
