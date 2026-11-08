-- A rating track follows the order its matches were played, whatever order they were uploaded in
-- (ADR 0008).
--
-- A match that arrives after a later match of one of its players recounts the track from the start.
-- A partial recount is not possible: `rating_history` does not keep every running total `ratings`
-- has (avg_cs and the multi-kill counts among them).

-- Rebuilds one rating track from its matches, in the order they were played.
CREATE FUNCTION "public"."replay_rating_track"(p_track integer)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec record;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('rating_track'), p_track);

  DELETE FROM rating_history WHERE ladder_season_id = p_track;
  DELETE FROM ratings WHERE ladder_season_id = p_track;

  FOR rec IN
    SELECT m.match_id
    FROM matches m
    JOIN match_participants mp ON mp.match_id = m.match_id
    WHERE m.ladder_season_id IS NOT NULL
      AND (p_track = 0 OR m.ladder_season_id = p_track)
    GROUP BY m.match_id, m.game_creation
    HAVING count(*) >= 10
    ORDER BY m.game_creation ASC, m.match_id ASC
  LOOP
    PERFORM _apply_rating_update_for_track(rec.match_id, p_track);
  END LOOP;
END;
$$;

-- Rates a new match on one track. The match only needs a recount when one of its players already
-- has a later match there; otherwise nothing that was counted depends on it.
CREATE FUNCTION "public"."_rate_match_on_track"(p_match_id bigint, p_track integer)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_game_creation timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('rating_track'), p_track);

  SELECT game_creation INTO v_game_creation FROM matches WHERE match_id = p_match_id;

  IF EXISTS (
    SELECT 1
    FROM match_participants mp
    JOIN rating_history rh
      ON rh.puuid = mp.puuid
      AND rh.ladder_season_id = p_track
    WHERE mp.match_id = p_match_id
      AND (rh.created_at, rh.match_id) > (v_game_creation, p_match_id)
  ) THEN
    PERFORM replay_rating_track(p_track);
  ELSE
    PERFORM _apply_rating_update_for_track(p_match_id, p_track);
  END IF;
END;
$$;

-- Tracks are always taken season first, all-time second, so two uploads cannot deadlock.
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

  PERFORM _rate_match_on_track(p_match_id, v_season);
  PERFORM _rate_match_on_track(p_match_id, 0);
END;
$$;

-- Reached only through the rating trigger, which runs as Derby Sync's service role.
REVOKE ALL ON FUNCTION "public"."replay_rating_track"(integer) FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."replay_rating_track"(integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."_rate_match_on_track"(bigint, integer) FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."_rate_match_on_track"(bigint, integer) TO "service_role";

-- Bring every track already out of order back in line, all-time last like an upload.
DO $$
DECLARE
  v_track integer;
BEGIN
  FOR v_track IN
    SELECT track
    FROM (
      SELECT DISTINCT ladder_season_id AS track FROM matches WHERE ladder_season_id IS NOT NULL
      UNION
      SELECT 0
    ) tracks
    ORDER BY track = 0, track
  LOOP
    PERFORM replay_rating_track(v_track);
  END LOOP;
END;
$$;
