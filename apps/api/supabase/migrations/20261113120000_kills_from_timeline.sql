-- Kills in player relations come straight from the match timeline.
--
-- `match_kills` was filled once from `matches.timeline_json` when it was created, and nothing wrote to
-- it afterwards, so "most killed" and "most killed by" only saw matches uploaded before February 21,
-- 2026. The kills of a player's matches are now read from their timelines when the relations are
-- asked for, and the table is gone. Executions (killerId 0) are not kills, as before.

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
  kills AS (
    SELECT
      mine.match_id,
      (e.event->>'killerId')::int AS killer_participant_id,
      (e.event->>'victimId')::int AS victim_participant_id
    FROM mine
    JOIN matches m ON m.match_id = mine.match_id
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(m.timeline_json->'frames') = 'array' THEN m.timeline_json->'frames'
        ELSE '[]'::jsonb
      END
    ) AS fr(frame)
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(fr.frame->'events') = 'array' THEN fr.frame->'events'
        ELSE '[]'::jsonb
      END
    ) AS e(event)
    WHERE (e.event->>'type') = 'CHAMPION_KILL'
      AND (e.event->>'killerId')::int > 0
      AND (e.event->>'victimId')::int > 0
  ),
  kills_by_me AS (
    SELECT victim.puuid, count(*)::integer AS kills
    FROM mine
    JOIN kills k
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
    JOIN kills k
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

DROP TABLE "public"."match_kills";
