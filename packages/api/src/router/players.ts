import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { isAllTime, seasonInput } from "../season";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const playersRouter = createTRPCRouter({
  all: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("players")
      .select("*")
      .order("last_seen_at", { ascending: false });
    if (error) throw error;
    return data;
  }),

  getByPuuid: publicProcedure
    .input(z.object({ puuid: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("players")
        .select("*")
        .eq("puuid", input.puuid)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data;
    }),

  getByRiotId: publicProcedure
    .input(
      z.object({ gameName: z.string().min(1), tagLine: z.string().min(1) }),
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("players")
        .select("*")
        .ilike("game_name", input.gameName)
        .ilike("tag_line", input.tagLine)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data;
    }),

  profileStats: publicProcedure
    .input(z.object({ puuid: z.string().min(1), season: seasonInput }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("ratings")
        .select(
          "*, player:players!inner(puuid, game_name, tag_line, profile_icon, first_seen_at, last_seen_at)",
        )
        .eq("puuid", input.puuid)
        .eq("ladder_season_id", input.season)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const { data: position, error: positionError } = await ctx.supabase.rpc(
        "standings_position",
        { p_puuid: input.puuid, p_track: input.season },
      );
      if (positionError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: positionError.message,
        });
      }

      return {
        ...data,
        matches_played: data.matches_played ?? 0,
        qualified: data.qualified ?? false,
        position: position ?? null,
      };
    }),

  ratingHistory: publicProcedure
    .input(z.object({ puuid: z.string().min(1), season: seasonInput }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("rating_history")
        .select("rating_after, created_at")
        .eq("puuid", input.puuid)
        .eq("ladder_season_id", input.season)
        .order("created_at", { ascending: true })
        .order("match_id", { ascending: true });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data;
    }),

  /** Final standing per season (last rating snapshot in that season), oldest season first. */
  seasonSummaries: publicProcedure
    .input(z.object({ puuid: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("rating_history")
        .select("ladder_season_id, rating_after, wins, losses")
        .eq("puuid", input.puuid)
        .gt("ladder_season_id", 0)
        .order("created_at", { ascending: false })
        .order("match_id", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const bySeason = new Map<number, (typeof data)[number]>();
      for (const row of data) {
        if (!bySeason.has(row.ladder_season_id)) {
          bySeason.set(row.ladder_season_id, row);
        }
      }

      return [...bySeason.values()]
        .map((row) => ({
          seasonId: row.ladder_season_id,
          rating: row.rating_after,
          wins: row.wins ?? 0,
          losses: row.losses ?? 0,
        }))
        .sort((a, b) => a.seasonId - b.seasonId);
    }),

  /** Teammates and rivals on a rating track; only qualified players are named. */
  relations: publicProcedure
    .input(z.object({ puuid: z.string().min(1), season: seasonInput }))
    .query(async ({ ctx, input }) => {
      const { data: rows, error } = await ctx.supabase.rpc("player_relations", {
        p_puuid: input.puuid,
        p_track: input.season,
      });
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const puuids = [...new Set(rows.map((row) => row.other_puuid))];
      const { data: players, error: playersError } =
        puuids.length > 0
          ? await ctx.supabase
              .from("players")
              .select("puuid, game_name, tag_line, profile_icon")
              .in("puuid", puuids)
          : { data: [], error: null };
      if (playersError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: playersError.message,
        });
      }

      const playerByPuuid = new Map(players.map((p) => [p.puuid, p]));
      const relation = (name: string) => {
        const row = rows.find((r) => r.relation === name);
        if (!row) return null;
        return {
          player: playerByPuuid.get(row.other_puuid) ?? {
            puuid: row.other_puuid,
            game_name: null,
            tag_line: null,
            profile_icon: null,
          },
          matches: row.matches,
          wins: row.wins,
          losses: row.losses,
          kills: row.kills,
        };
      };

      const bestRecord = relation("best_head_to_head");
      const worstRecord = relation("worst_head_to_head");

      return {
        teammates: {
          mostMatches: relation("most_matches_with"),
          mostWins: relation("most_wins_with"),
          mostLosses: relation("most_losses_with"),
        },
        rivals: {
          bestRecord,
          // With a single eligible rival, the best and worst record are the same player.
          worstRecord:
            worstRecord?.player.puuid === bestRecord?.player.puuid
              ? null
              : worstRecord,
          mostKilled: relation("most_killed"),
          mostKilledBy: relation("most_killed_by"),
        },
      };
    }),

  mostPlayedChampions: publicProcedure
    .input(
      z.object({
        puuid: z.string().min(1),
        season: seasonInput,
        limit: z.number().min(1).max(20).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("match_participants")
        .select(
          "champion_id, kills, deaths, assists, match:matches!inner(match_id, ladder_season_id, teams(team_id, win)), team_id",
        )
        .eq("puuid", input.puuid);
      if (!isAllTime(input.season)) {
        query = query.eq("match.ladder_season_id", input.season);
      }
      const { data, error } = await query;
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const map = new Map<
        number,
        {
          games: number;
          wins: number;
          kills: number;
          deaths: number;
          assists: number;
        }
      >();

      for (const row of data) {
        const champId = row.champion_id;
        if (champId == null) continue;

        const teams = Array.isArray(row.match)
          ? (
              row.match[0] as {
                teams: { team_id: number; win: boolean }[];
              } | null
            )?.teams
          : (row.match as { teams: { team_id: number; win: boolean }[] } | null)
              ?.teams;

        const won = teams?.find((t) => t.team_id === row.team_id)?.win ?? false;

        const entry = map.get(champId) ?? {
          games: 0,
          wins: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
        };
        entry.games += 1;
        if (won) entry.wins += 1;
        entry.kills += row.kills ?? 0;
        entry.deaths += row.deaths ?? 0;
        entry.assists += row.assists ?? 0;
        map.set(champId, entry);
      }

      return Array.from(map.entries())
        .map(([championId, stats]) => ({ championId, ...stats }))
        .sort((a, b) => b.games - a.games)
        .slice(0, input.limit);
    }),
});
