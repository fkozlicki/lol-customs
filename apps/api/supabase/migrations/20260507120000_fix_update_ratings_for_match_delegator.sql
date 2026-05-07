-- Restore update_ratings_for_match as a thin delegator to apply_rating_update_for_match.
-- Migration 20260425200000 inlined legacy trigger logic that SET effective_rating on ratings,
-- but effective_rating was dropped in 20260220130000. The delegator keeps trigger behavior
-- aligned with the current rating algorithm and avoids schema drift.

CREATE OR REPLACE FUNCTION "public"."update_ratings_for_match"() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  match_id_var bigint;
BEGIN
  match_id_var := NEW.match_id;

  IF (SELECT count(*) FROM match_participants WHERE match_id = match_id_var) < 10 THEN
    RETURN null;
  END IF;

  IF EXISTS (SELECT 1 FROM rating_history WHERE match_id = match_id_var) THEN
    RETURN null;
  END IF;

  PERFORM apply_rating_update_for_match(match_id_var);
  RETURN null;
END;
$$;

ALTER FUNCTION "public"."update_ratings_for_match"() OWNER TO "postgres";
