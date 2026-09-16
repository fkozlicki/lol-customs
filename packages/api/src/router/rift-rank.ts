import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { isAllTime, seasonInput } from "../season";
import { createTRPCRouter, publicProcedure } from "../trpc";

const afterGamesSchema = z.number().int().min(1).max(100_000);

function toIsoDate(value: string): string {
  return new Date(value).toISOString();
}

const hofTitleSchema = z.enum([
  "most_kills",
  "most_assists",
  "best_farm",
  "cannon_fodder",
  "mvp",
  "penta_hunter",
  "vision_master",
  "damage_dealer",
  "gold_hoarder",
  "ace",
  "quadra_killer",
  "triple_threat",
  "tank",
  "life_saver",
  "cc_king",
  "tower_crusher",
  "jungle_clearer",
  "op_score",
  "big_spender",
  "level_lead",
  "tilted",
  "feeder",
  "pacifist",
  "lone_wolf",
  "blind",
  "tower_hugger",
  "behind",
  "broke",
  "no_heals",
  "bottom_of_ladder",
  "cold",
  "veteran_of_defeat",
  "worst_win_rate",
  "never_mvp",
  "never_ace",
  "peashooter",
  "hoarder",
]);

export const riftRankRouter = createTRPCRouter({
  /** Row count in `matches` for the season — drives the "1 … N, live" picker (same cardinality as ladder games if every row is one rated game). */
  ladderRatedMatchCount: publicProcedure
    .input(z.object({ season: seasonInput }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("matches")
        .select("*", { count: "exact", head: true });
      if (!isAllTime(input.season)) {
        query = query.eq("ladder_season_id", input.season);
      }
      const { count, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const n = count ?? 0;
      if (!Number.isFinite(n) || n < 0) {
        return 0;
      }
      return Math.min(n, 100_000);
    }),

  leaderboard: publicProcedure
    .input(
      z.object({
        season: seasonInput,
        limit: z.number().min(1).max(200).default(50),
        afterGames: afterGamesSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { season, limit, afterGames } = input;

      if (afterGames) {
        const offset = afterGames - 1;
        let matchQuery = ctx.supabase.from("matches").select("match_id");
        if (!isAllTime(season)) {
          matchQuery = matchQuery.eq("ladder_season_id", season);
        }
        const { data: matchRows, error: matchError } = await matchQuery
          .order("game_creation", { ascending: true })
          .order("match_id", { ascending: true })
          .range(offset, offset);

        if (matchError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: matchError.message,
          });
        }

        const targetMatchId = matchRows?.[0]?.match_id;
        if (targetMatchId == null) {
          return [];
        }

        const { data: endSnapshot, error: endError } = await ctx.supabase
          .from("rating_history")
          .select("created_at")
          .eq("match_id", targetMatchId)
          .eq("ladder_season_id", season)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (endError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: endError.message,
          });
        }

        const snapshotAt = endSnapshot?.created_at;
        if (!snapshotAt) {
          return [];
        }

        const { data, error } = await ctx.supabase.rpc("leaderboard_at", {
          p_at: toIsoDate(snapshotAt),
          p_track: season,
          p_limit: limit,
        });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        return (data ?? []).map((row) => ({
          puuid: row.puuid,
          rating: row.rating,
          wins: row.wins,
          losses: row.losses,
          best_streak: row.best_streak,
          win_streak: row.win_streak,
          lose_streak: row.lose_streak,
          updated_at: row.updated_at,
          avg_kills: row.avg_kills,
          avg_deaths: row.avg_deaths,
          avg_assists: row.avg_assists,
          mvp_games: row.mvp_games,
          ace_games: row.ace_games,
          matches_played: row.wins + row.losses,
          qualified: row.qualified,
          player: {
            puuid: row.puuid,
            game_name: row.game_name,
            tag_line: row.tag_line,
            profile_icon: row.profile_icon,
            platform_id: row.platform_id,
          },
        }));
      }

      const { data, error } = await ctx.supabase
        .from("ratings")
        .select(
          "puuid, rating, wins, losses, best_streak, win_streak, lose_streak, updated_at, avg_kills, avg_deaths, avg_assists, mvp_games, ace_games, matches_played, qualified, player:players!inner(puuid, game_name, tag_line, profile_icon, platform_id)",
        )
        .eq("ladder_season_id", season)
        .not("rating", "is", null)
        .order("qualified", { ascending: false })
        .order("rating", { ascending: false })
        .limit(limit);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Qualified players keep rating order; players still qualifying go by matches played.
      return data
        .map((row) => ({
          ...row,
          matches_played: row.matches_played ?? 0,
          qualified: row.qualified ?? false,
        }))
        .sort((a, b) => {
          if (a.qualified !== b.qualified) return a.qualified ? -1 : 1;
          const byRating = (b.rating ?? 0) - (a.rating ?? 0);
          return a.qualified
            ? byRating
            : b.matches_played - a.matches_played || byRating;
        });
    }),

  /** Returns top player for every HoF title plus the stat value. Single query round-trip. */
  hofLeaders: publicProcedure.input(z.object({ season: seasonInput })).query(
    async ({
      ctx,
      input,
    }): Promise<
      Record<
        z.infer<typeof hofTitleSchema>,
        {
          game_name: string | null;
          tag_line: string | null;
          profile_icon: number | null;
          value: number | null;
        } | null
      >
    > => {
      type HofTitleId = z.infer<typeof hofTitleSchema>;
      type HofEntry = {
        game_name: string | null;
        tag_line: string | null;
        profile_icon: number | null;
        value: number | null;
      } | null;

      const SIMPLE = {
        most_kills: { column: "avg_kills", ascending: false },
        most_assists: { column: "avg_assists", ascending: false },
        best_farm: { column: "avg_cs", ascending: false },
        cannon_fodder: { column: "avg_deaths", ascending: false },
        mvp: { column: "mvp_games", ascending: false },
        penta_hunter: { column: "total_penta_kills", ascending: false },
        vision_master: { column: "avg_vision_score", ascending: false },
        damage_dealer: { column: "avg_damage_to_champions", ascending: false },
        gold_hoarder: { column: "avg_gold_earned", ascending: false },
        ace: { column: "ace_games", ascending: false },
        quadra_killer: { column: "total_quadra_kills", ascending: false },
        triple_threat: { column: "total_triple_kills", ascending: false },
        tank: { column: "avg_damage_taken", ascending: false },
        life_saver: { column: "avg_heal", ascending: false },
        cc_king: { column: "avg_cc_time", ascending: false },
        tower_crusher: { column: "avg_turret_kills", ascending: false },
        jungle_clearer: { column: "avg_neutral_minions", ascending: false },
        op_score: { column: "avg_op_score", ascending: false },
        big_spender: { column: "avg_gold_spent", ascending: false },
        level_lead: { column: "avg_champ_level", ascending: false },
        tilted: { column: "lose_streak", ascending: false },
        feeder: { column: "avg_kda", ascending: true },
        pacifist: { column: "avg_kills", ascending: true },
        lone_wolf: { column: "avg_assists", ascending: true },
        blind: { column: "avg_vision_score", ascending: true },
        tower_hugger: { column: "avg_turret_kills", ascending: true },
        behind: { column: "avg_champ_level", ascending: true },
        broke: { column: "avg_gold_earned", ascending: true },
        no_heals: { column: "avg_heal", ascending: true },
        bottom_of_ladder: { column: "rating", ascending: true },
        cold: { column: "best_streak", ascending: true },
        veteran_of_defeat: { column: "losses", ascending: false },
        peashooter: { column: "avg_damage_to_champions", ascending: true },
        hoarder: { column: "avg_gold_spent", ascending: true },
      } as const satisfies Record<
        string,
        { column: string; ascending: boolean }
      >;

      const simpleTitleIds = Object.keys(SIMPLE) as HofTitleId[];
      const allTitleIds: HofTitleId[] = [
        ...simpleTitleIds,
        "worst_win_rate",
        "never_mvp",
        "never_ace",
      ];
      const result = Object.fromEntries(
        allTitleIds.map((id) => [id, null as HofEntry]),
      ) as Record<HofTitleId, HofEntry>;

      const throwOnError = (error: { message: string } | null) => {
        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
      };

      const fetchPlayer = async (puuid: string): Promise<HofEntry> => {
        const { data: player } = await ctx.supabase
          .from("players")
          .select("game_name, tag_line, profile_icon")
          .eq("puuid", puuid)
          .single();
        return player ? { ...player, value: null } : null;
      };

      const [worstWinRate, neverMvp, neverAce, ...simpleResults] =
        await Promise.all([
          (async (): Promise<HofEntry> => {
            const { data: rows, error } = await ctx.supabase
              .from("ratings")
              .select("puuid, wins, losses")
              .eq("ladder_season_id", input.season)
              .eq("qualified", true);
            throwOnError(error);
            const withRate = (rows ?? [])
              .map((r) => ({
                puuid: r.puuid,
                rate: (r.wins ?? 0) / ((r.wins ?? 0) + (r.losses ?? 0)),
              }))
              .sort((a, b) => a.rate - b.rate);
            const puuid = withRate[0]?.puuid;
            if (!puuid) return null;
            const entry = await fetchPlayer(puuid);
            const rate = withRate[0]?.rate ?? null;
            return entry
              ? {
                  ...entry,
                  value: rate !== null ? Math.round(rate * 100) / 100 : null,
                }
              : null;
          })(),
          (async (): Promise<HofEntry> => {
            const { data: ratingRows, error } = await ctx.supabase
              .from("ratings")
              .select("puuid")
              .eq("ladder_season_id", input.season)
              .eq("qualified", true)
              .eq("mvp_games", 0)
              .order("wins", { ascending: false })
              .limit(1);
            throwOnError(error);
            const puuid = ratingRows?.[0]?.puuid;
            if (!puuid) return null;
            const entry = await fetchPlayer(puuid);
            return entry ? { ...entry, value: 0 } : null;
          })(),
          (async (): Promise<HofEntry> => {
            const { data: ratingRows, error } = await ctx.supabase
              .from("ratings")
              .select("puuid")
              .eq("ladder_season_id", input.season)
              .eq("qualified", true)
              .eq("ace_games", 0)
              .order("wins", { ascending: false })
              .limit(1);
            throwOnError(error);
            const puuid = ratingRows?.[0]?.puuid;
            if (!puuid) return null;
            const entry = await fetchPlayer(puuid);
            return entry ? { ...entry, value: 0 } : null;
          })(),
          ...(Object.entries(SIMPLE).map(
            async ([id, config]): Promise<[HofTitleId, HofEntry]> => {
              const { data, error } = await ctx.supabase
                .from("ratings")
                .select(
                  `${config.column}, player:players!inner(game_name, tag_line, profile_icon)`,
                )
                .eq("ladder_season_id", input.season)
                .eq("qualified", true)
                .order(config.column, { ascending: config.ascending })
                .limit(1);

              throwOnError(error);

              const row = data?.[0] as unknown as
                | ({ [k: string]: number | null } & {
                    player: {
                      game_name: string | null;
                      tag_line: string | null;
                      profile_icon: number | null;
                    } | null;
                  })
                | undefined;

              if (!row?.player) return [id as HofTitleId, null];

              const value = row[config.column] ?? null;
              return [
                id as HofTitleId,
                {
                  game_name: row.player.game_name ?? null,
                  tag_line: row.player.tag_line ?? null,
                  profile_icon: row.player.profile_icon ?? null,
                  value: value != null ? Number(value) : null,
                },
              ];
            },
          ) as Promise<[HofTitleId, HofEntry]>[]),
        ]);

      result.worst_win_rate = worstWinRate;
      result.never_mvp = neverMvp;
      result.never_ace = neverAce;
      for (const [id, entry] of simpleResults) {
        result[id] = entry;
      }

      return result;
    },
  ),
});
