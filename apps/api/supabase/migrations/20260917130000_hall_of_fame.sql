-- Hall of Fame titles for one rating track.
--
-- Returns every holder per title; players tied on the value share it. Only qualified players take
-- part. Counting titles (MVPs, pentakills, streaks) need a value above zero, so nobody holds "most
-- pentakills" with none. Jungle titles only count matches played as jungler, and need at least three.

DROP FUNCTION IF EXISTS "public"."hall_of_fame"(integer);

CREATE FUNCTION "public"."hall_of_fame"(p_track integer)
RETURNS TABLE (
  title text,
  puuid text,
  value numeric
)
LANGUAGE sql
STABLE
AS $$
  WITH qualified AS (
    SELECT r.*
    FROM ratings r
    WHERE r.ladder_season_id = p_track
      AND r.qualified
  ),
  longest_lose_streak AS (
    SELECT rh.puuid, max(rh.lose_streak) AS streak
    FROM rating_history rh
    WHERE rh.ladder_season_id = p_track
    GROUP BY rh.puuid
  ),
  -- Role per participant, the same way OP score assigns it.
  jungle AS (
    SELECT j.puuid, avg(j.neutral_minions_killed) AS avg_jungle_cs
    FROM (
      SELECT
        mp.puuid,
        mp.neutral_minions_killed,
        public._op_effective_role_bucket(
          m.map_id,
          count(*) OVER (PARTITION BY mp.match_id),
          mp.participant_id,
          mp.role,
          mp.lane,
          mp.total_minions_killed,
          mp.neutral_minions_killed
        ) AS role_bucket
      FROM match_participants mp
      JOIN matches m ON m.match_id = mp.match_id
      WHERE p_track = 0 OR m.ladder_season_id = p_track
    ) j
    WHERE j.role_bucket = 'JUNGLE'
    GROUP BY j.puuid
    HAVING count(*) >= 3
  ),
  candidates AS (
    SELECT q.puuid, t.title, t.value, t.highest_wins
    FROM qualified q
    LEFT JOIN longest_lose_streak l ON l.puuid = q.puuid
    LEFT JOIN jungle jg ON jg.puuid = q.puuid
    CROSS JOIN LATERAL (
      VALUES
        -- Headline
        ('mvp', nullif(q.mvp_games, 0)::numeric, true),
        ('never_mvp', CASE WHEN q.mvp_games = 0 THEN q.matches_played END::numeric, true),
        ('ace', nullif(q.ace_games, 0)::numeric, true),
        ('never_ace', CASE WHEN q.ace_games = 0 THEN q.matches_played END::numeric, true),
        ('op_score', q.avg_op_score, true),
        ('worst_op_score', q.avg_op_score, false),
        -- Form
        ('best_win_rate', q.wins::numeric / nullif(q.matches_played, 0), true),
        ('worst_win_rate', q.wins::numeric / nullif(q.matches_played, 0), false),
        ('best_streak', nullif(q.best_streak, 0)::numeric, true),
        ('tilted', nullif(l.streak, 0)::numeric, true),
        -- Fighting
        ('most_kills', q.avg_kills, true),
        ('pacifist', q.avg_kills, false),
        ('most_assists', q.avg_assists, true),
        ('lone_wolf', q.avg_assists, false),
        ('damage_dealer', q.avg_damage_to_champions, true),
        ('peashooter', q.avg_damage_to_champions, false),
        ('fewest_deaths', q.avg_deaths, false),
        ('cannon_fodder', q.avg_deaths, true),
        ('best_kda', q.avg_kda, true),
        ('feeder', q.avg_kda, false),
        ('cc_king', q.avg_cc_time, true),
        ('no_cc', q.avg_cc_time, false),
        ('penta_hunter', nullif(q.total_penta_kills, 0)::numeric, true),
        -- Farm and gold
        ('best_farm', q.avg_cs, true),
        ('worst_farm', q.avg_cs, false),
        ('jungle_clearer', jg.avg_jungle_cs, true),
        ('jungle_tourist', jg.avg_jungle_cs, false),
        ('gold_hoarder', q.avg_gold_earned, true),
        ('broke', q.avg_gold_earned, false),
        ('level_lead', q.avg_champ_level, true),
        ('behind', q.avg_champ_level, false),
        -- Map and utility
        ('vision_master', q.avg_vision_score, true),
        ('blind', q.avg_vision_score, false),
        ('life_saver', q.avg_heal, true),
        ('no_heals', q.avg_heal, false),
        ('tower_crusher', q.avg_turret_kills, true),
        ('tower_hugger', q.avg_turret_kills, false)
    ) AS t(title, value, highest_wins)
    WHERE t.value IS NOT NULL
  ),
  ranked AS (
    SELECT
      c.title,
      c.puuid,
      c.value,
      dense_rank() OVER (
        PARTITION BY c.title
        ORDER BY CASE WHEN c.highest_wins THEN -c.value ELSE c.value END
      )::integer AS rank
    FROM candidates c
  )
  SELECT ranked.title, ranked.puuid, ranked.value
  FROM ranked
  WHERE ranked.rank = 1;
$$;

GRANT EXECUTE ON FUNCTION "public"."hall_of_fame"(integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."hall_of_fame"(integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."hall_of_fame"(integer) TO "service_role";
