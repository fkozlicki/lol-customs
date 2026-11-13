-- Read models the API used to assemble in TypeScript, each one query in SQL.
--
-- * Riot ID lookups compare one normalised key (trimmed, lower case), through an expression index,
--   instead of `ilike`, which treated `%` and `_` as wildcards. Two players can carry the same Riot
--   ID after a rename; the lookup picks the one seen most recently, who is the ID's current holder.
-- * `player_relations` and `hall_of_fame` return the other player's name and icon.
-- * `player_champions`, `standings_after_match` and `forum_post_list` count in the database what the
--   API used to fetch row by row and count itself.
-- Nothing here changes a column Derby Sync writes.

-- Riot ID lookups ---------------------------------------------------------------------------------

-- Mirrors `riotIdKey` in @v1/domain/riot-id.
create function public.riot_id_key(p_game_name text, p_tag_line text)
returns text
language sql
immutable
parallel safe
as $$
  select lower(btrim(p_game_name, E' \t\n\r')) || '#' || lower(btrim(p_tag_line, E' \t\n\r'));
$$;

create index players_riot_id_key_idx on public.players (public.riot_id_key(game_name, tag_line));

/** The player who carries this Riot ID now: of several, the one seen most recently. */
create function public.player_by_riot_id(p_game_name text, p_tag_line text)
returns setof public.players
language sql
stable
as $$
  select p.*
  from public.players p
  where public.riot_id_key(p.game_name, p.tag_line) = public.riot_id_key(p_game_name, p_tag_line)
  order by p.last_seen_at desc nulls last, p.puuid
  limit 1;
$$;

-- Each Riot ID's latest Solo/Duo rank, by its place in the arrays; null for an unknown or unranked
-- player. The auction pool attaches these to the players it is given.
create function public.latest_ranks_by_riot_id(p_game_names text[], p_tag_lines text[])
returns table (ordinal integer, rank_tier text, rank_division text)
language sql
stable
as $$
  select ids.ordinal::integer, rank.rank_tier, rank.rank_division
  from unnest(p_game_names, p_tag_lines) with ordinality as ids (game_name, tag_line, ordinal)
  left join lateral public.player_by_riot_id(ids.game_name, ids.tag_line) p on true
  left join lateral (
    select r.rank_tier, r.rank_division
    from public.player_latest_ranks() r
    where r.puuid = p.puuid
  ) rank on true
  order by ids.ordinal;
$$;

-- Names in the profile and Hall of Fame records ----------------------------------------------------

-- The return type grows, so the functions are dropped and created again.
drop function public.player_relations(text, integer);
create function public.player_relations(p_puuid text, p_track integer)
returns table (
  relation text, other_puuid text, matches integer, wins integer, losses integer, kills integer,
  game_name text, tag_line text, profile_icon integer
)
language sql
stable
as $$
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
  ),
  relations (relation, other_puuid, matches, wins, losses, kills) AS (
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
    )
  )
  SELECT r.*, p.game_name, p.tag_line, p.profile_icon
  FROM relations r
  LEFT JOIN public.players p ON p.puuid = r.other_puuid;
$$;

drop function public.hall_of_fame(integer);
create function public.hall_of_fame(p_track integer)
returns table (
  title text, puuid text, value numeric, game_name text, tag_line text, profile_icon integer
)
language sql
stable
as $$
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
  multikills AS (
    SELECT
      mp.puuid,
      sum(coalesce(mp.double_kills, 0)) AS doubles,
      sum(coalesce(mp.triple_kills, 0)) AS triples,
      sum(coalesce(mp.quadra_kills, 0)) AS quadras,
      sum(coalesce(mp.penta_kills, 0)) AS pentas
    FROM match_participants mp
    JOIN matches m ON m.match_id = mp.match_id
    WHERE p_track = 0 OR m.ladder_season_id = p_track
    GROUP BY mp.puuid
  ),
  candidates AS (
    SELECT q.puuid, t.title, t.value, t.highest_wins
    FROM qualified q
    LEFT JOIN longest_lose_streak l ON l.puuid = q.puuid
    LEFT JOIN jungle jg ON jg.puuid = q.puuid
    LEFT JOIN multikills mk ON mk.puuid = q.puuid
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

        -- Multikills
        ('double_trouble', nullif(mk.doubles, 0), true),
        ('triple_threat', nullif(mk.triples, 0), true),
        ('quadra_killer', nullif(mk.quadras, 0), true),
        ('penta_hunter', nullif(mk.pentas, 0), true),
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
  SELECT ranked.title, ranked.puuid, ranked.value, p.game_name, p.tag_line, p.profile_icon
  FROM ranked
  LEFT JOIN public.players p ON p.puuid = ranked.puuid
  WHERE ranked.rank = 1
  ORDER BY ranked.title, ranked.puuid;
$$;

-- A player's champions ------------------------------------------------------------------------------

-- Matches, wins and total KDA per champion on one rating track, most played first.
create function public.player_champions(p_puuid text, p_track integer, p_limit integer default 5)
returns table (
  champion_id integer, games integer, wins integer, kills integer, deaths integer, assists integer
)
language sql
stable
as $$
  select
    mp.champion_id,
    count(*)::integer,
    count(*) filter (where t.win)::integer,
    coalesce(sum(mp.kills), 0)::integer,
    coalesce(sum(mp.deaths), 0)::integer,
    coalesce(sum(mp.assists), 0)::integer
  from public.match_participants mp
  join public.matches m on m.match_id = mp.match_id
  left join public.teams t on t.match_id = mp.match_id and t.team_id = mp.team_id
  where mp.puuid = p_puuid
    and mp.champion_id is not null
    and (p_track = 0 or m.ladder_season_id = p_track)
  group by mp.champion_id
  order by 2 desc, 3 desc, 1
  limit greatest(1, least(coalesce(p_limit, 5), 20));
$$;

-- Standings after the Nth match ---------------------------------------------------------------------

-- The standings of a rating track as they stood right after its Nth match (by game time) was rated.
-- Empty when the track has fewer matches, or the Nth was not rated on it.
create function public.standings_after_match(p_track integer, p_matches integer, p_limit integer default 50)
returns table (
  puuid text, rating integer, wins integer, losses integer, best_streak integer, win_streak integer,
  lose_streak integer, updated_at timestamp with time zone, avg_kills numeric, avg_deaths numeric,
  avg_assists numeric, mvp_games integer, ace_games integer, game_name text, tag_line text,
  profile_icon integer, platform_id text, qualified boolean
)
language sql
stable
as $$
  select *
  from public.leaderboard_at(
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
$$;

-- Forum ---------------------------------------------------------------------------------------------

-- Posts with their reaction and comment counts. `security_invoker` keeps the tables' RLS in force.
create view public.forum_post_list with (security_invoker = on) as
select
  p.id,
  p.title,
  p.content,
  p.created_at,
  p.author_id,
  (select count(*) from public.forum_reactions r where r.post_id = p.id and r.type = 'like')::integer
    as likes,
  (select count(*) from public.forum_reactions r where r.post_id = p.id and r.type = 'dislike')::integer
    as dislikes,
  (select count(*) from public.forum_comments c where c.post_id = p.id)::integer as comment_count
from public.forum_posts p;

revoke all on public.forum_post_list from public, anon, authenticated;
grant select on public.forum_post_list to anon, authenticated;
