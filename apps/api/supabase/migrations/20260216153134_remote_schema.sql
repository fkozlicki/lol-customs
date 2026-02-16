


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."update_ratings_for_match"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  match_id_var bigint;
begin
  match_id_var := NEW.match_id;

  -- Wait until full match (10 players)
  if (
    select count(*) from match_participants
    where match_id = match_id_var
  ) < 10 then
    return null;
  end if;

  -- Prevent running twice
  if exists (
    select 1 from rating_history where match_id = match_id_var
  ) then
    return null;
  end if;

  -- Ensure ratings rows exist
  insert into ratings (puuid)
  select distinct puuid
  from match_participants
  where match_id = match_id_var
  on conflict do nothing;

  -- Compute team averages
  with team_data as (
    select
      mp.team_id,
      avg(r.rating) as avg_rating,
      bool_or(mp.win) as win
    from match_participants mp
    join ratings r using (puuid)
    where mp.match_id = match_id_var
    group by mp.team_id
  ),
  expected as (
    select
      t1.team_id,
      1.0 / (1 + power(10, (t2.avg_rating - t1.avg_rating) / 400.0)) as expected_score,
      t1.win
    from team_data t1
    join team_data t2 on t1.team_id <> t2.team_id
  )
  update ratings r
  set
    rating = r.rating +
      round(
        32 * (
          case when e.win then 1 else 0 end
          - e.expected_score
        )
      ),

    wins = r.wins + case when mp.win then 1 else 0 end,
    losses = r.losses + case when mp.win then 0 else 1 end,

    win_streak =
      case
        when mp.win then r.win_streak + 1
        else 0
      end,

    lose_streak =
      case
        when mp.win then 0
        else r.lose_streak + 1
      end,

    best_streak =
      case
        when mp.win then greatest(r.best_streak, r.win_streak + 1)
        else r.best_streak
      end,

    updated_at = now()

  from match_participants mp
  join expected e on mp.team_id = e.team_id
  where mp.puuid = r.puuid
    and mp.match_id = match_id_var;

  -- Insert rating history snapshot
  insert into rating_history (puuid, match_id, rating_after)
  select puuid, match_id_var, rating
  from ratings
  where puuid in (
    select puuid from match_participants where match_id = match_id_var
  );

  return null;
end;
$$;


ALTER FUNCTION "public"."update_ratings_for_match"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."match_participants" (
    "match_id" bigint NOT NULL,
    "puuid" "text" NOT NULL,
    "participant_id" integer,
    "team_id" integer,
    "champion_id" integer,
    "spell1_id" integer,
    "spell2_id" integer,
    "champ_level" integer,
    "kills" integer,
    "deaths" integer,
    "assists" integer,
    "double_kills" integer,
    "triple_kills" integer,
    "quadra_kills" integer,
    "penta_kills" integer,
    "largest_killing_spree" integer,
    "largest_multi_kill" integer,
    "total_damage_dealt" integer,
    "total_damage_dealt_to_champions" integer,
    "total_damage_taken" integer,
    "damage_self_mitigated" integer,
    "physical_damage_dealt" integer,
    "magic_damage_dealt" integer,
    "true_damage_dealt" integer,
    "gold_earned" integer,
    "gold_spent" integer,
    "total_minions_killed" integer,
    "neutral_minions_killed" integer,
    "vision_score" integer,
    "wards_placed" integer,
    "wards_killed" integer,
    "turret_kills" integer,
    "inhibitor_kills" integer,
    "total_heal" integer,
    "total_time_cc_dealt" integer,
    "time_ccing_others" integer,
    "perk_primary_style" integer,
    "perk_sub_style" integer,
    "lane" "text",
    "role" "text",
    "win" boolean
);


ALTER TABLE "public"."match_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "match_id" bigint NOT NULL,
    "platform_id" "text" NOT NULL,
    "game_creation" timestamp with time zone NOT NULL,
    "duration" integer NOT NULL,
    "game_mode" "text",
    "game_type" "text",
    "queue_id" integer,
    "map_id" integer,
    "patch" "text",
    "season_id" integer,
    "end_of_game_result" "text",
    "raw_json" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."players" (
    "puuid" "text" NOT NULL,
    "game_name" "text",
    "tag_line" "text",
    "profile_icon" integer,
    "platform_id" "text",
    "first_seen_at" timestamp with time zone DEFAULT "now"(),
    "last_seen_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rating_history" (
    "puuid" "text" NOT NULL,
    "match_id" bigint NOT NULL,
    "rating_after" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rating_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ratings" (
    "puuid" "text" NOT NULL,
    "rating" integer DEFAULT 1000,
    "wins" integer DEFAULT 0,
    "losses" integer DEFAULT 0,
    "best_streak" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "win_streak" integer DEFAULT 0,
    "lose_streak" integer DEFAULT 0
);


ALTER TABLE "public"."ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "match_id" bigint NOT NULL,
    "team_id" integer NOT NULL,
    "win" boolean,
    "baron_kills" integer,
    "dragon_kills" integer,
    "rift_herald_kills" integer,
    "inhibitor_kills" integer,
    "tower_kills" integer,
    "first_baron" boolean,
    "first_blood" boolean,
    "first_tower" boolean
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


ALTER TABLE ONLY "public"."match_participants"
    ADD CONSTRAINT "match_participants_pkey" PRIMARY KEY ("match_id", "puuid");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("match_id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("puuid");



ALTER TABLE ONLY "public"."rating_history"
    ADD CONSTRAINT "rating_history_pkey" PRIMARY KEY ("puuid", "match_id");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_pkey" PRIMARY KEY ("puuid");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("match_id", "team_id");



CREATE INDEX "idx_matches_date" ON "public"."matches" USING "btree" ("game_creation");



CREATE INDEX "idx_matches_patch" ON "public"."matches" USING "btree" ("patch");



CREATE INDEX "idx_participants_match" ON "public"."match_participants" USING "btree" ("match_id");



CREATE INDEX "idx_participants_puuid" ON "public"."match_participants" USING "btree" ("puuid");



CREATE OR REPLACE TRIGGER "trg_update_ratings" AFTER INSERT ON "public"."match_participants" FOR EACH ROW EXECUTE FUNCTION "public"."update_ratings_for_match"();



ALTER TABLE ONLY "public"."match_participants"
    ADD CONSTRAINT "match_participants_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("match_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_participants"
    ADD CONSTRAINT "match_participants_puuid_fkey" FOREIGN KEY ("puuid") REFERENCES "public"."players"("puuid");



ALTER TABLE ONLY "public"."rating_history"
    ADD CONSTRAINT "rating_history_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("match_id");



ALTER TABLE ONLY "public"."rating_history"
    ADD CONSTRAINT "rating_history_puuid_fkey" FOREIGN KEY ("puuid") REFERENCES "public"."players"("puuid");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_puuid_fkey" FOREIGN KEY ("puuid") REFERENCES "public"."players"("puuid");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("match_id") ON DELETE CASCADE;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ratings_for_match"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ratings_for_match"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ratings_for_match"() TO "service_role";



GRANT ALL ON TABLE "public"."match_participants" TO "anon";
GRANT ALL ON TABLE "public"."match_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."match_participants" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON TABLE "public"."rating_history" TO "anon";
GRANT ALL ON TABLE "public"."rating_history" TO "authenticated";
GRANT ALL ON TABLE "public"."rating_history" TO "service_role";



GRANT ALL ON TABLE "public"."ratings" TO "anon";
GRANT ALL ON TABLE "public"."ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."ratings" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







RESET ALL;
