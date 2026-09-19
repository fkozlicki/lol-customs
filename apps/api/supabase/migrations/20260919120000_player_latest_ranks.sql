-- Last known Solo/Duo rank per player, taken from the most recent match where the client reported one.
-- Lets the app show ranks without calling the Riot API.

CREATE OR REPLACE FUNCTION "public"."player_latest_ranks"()
RETURNS TABLE (
  puuid text,
  rank_tier text,
  rank_division text
)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT ON (mp.puuid)
    mp.puuid,
    mp.rank_tier,
    mp.rank_division
  FROM match_participants mp
  JOIN matches m ON m.match_id = mp.match_id
  WHERE mp.rank_tier IS NOT NULL
  ORDER BY mp.puuid, m.game_creation DESC, mp.match_id DESC;
$$;

GRANT EXECUTE ON FUNCTION "public"."player_latest_ranks"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."player_latest_ranks"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."player_latest_ranks"() TO "service_role";
