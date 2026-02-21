import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

interface LeaderboardRatingRow {
  puuid: string;
  rating: number | null;
  wins: number | null;
  losses: number | null;
  best_streak: number | null;
  win_streak: number | null;
  lose_streak: number | null;
  updated_at: string | null;
  avg_kills: number | null;
  avg_deaths: number | null;
  avg_assists: number | null;
}

interface LeaderboardEntry extends LeaderboardRatingRow {
  player: {
    puuid: string;
    game_name: string | null;
    tag_line: string | null;
    profile_icon: number | null;
    platform_id: string | null;
  } | null;
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
  leaderboard: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }): Promise<LeaderboardEntry[]> => {
      const limit = input?.limit ?? 50;
      const { data: ratings, error: ratingsError } = await ctx.supabase
        .from("ratings")
        .select(
          "puuid, rating, wins, losses, best_streak, win_streak, lose_streak, updated_at, avg_kills, avg_deaths, avg_assists",
        )
        .not("rating", "is", null)
        .order("rating", { ascending: false })
        .limit(limit);

      if (ratingsError) throw ratingsError;
      const rawRows = ratings ?? [];
      if (!rawRows.length) return [];
      const rows: LeaderboardRatingRow[] = rawRows as LeaderboardRatingRow[];
      const puuids = rows.map((r) => r.puuid);
      const { data: playersData, error: playersError } = await ctx.supabase
        .from("players")
        .select("puuid, game_name, tag_line, profile_icon, platform_id")
        .in("puuid", puuids);
      if (playersError) throw playersError;
      type PlayerRow = {
        puuid: string;
        game_name: string | null;
        tag_line: string | null;
        profile_icon: number | null;
        platform_id: string | null;
      };
      const players = (playersData ?? []) as PlayerRow[];
      const playerMap = new Map(players.map((p) => [p.puuid, p]));
      const result: LeaderboardEntry[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]!;
        result.push({
          ...r,
          player: playerMap.get(r.puuid) ?? null,
        });
      }
      return result;
    }),

  getByPuuid: publicProcedure
    .input(z.object({ puuid: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("ratings")
        .select("*")
        .eq("puuid", input.puuid)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data;
    }),
  /** Returns top player for every HoF title plus the stat value. Single query round-trip. */
  hofLeaders: publicProcedure.query(
    async ({
      ctx,
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
              .not("wins", "is", null)
              .not("losses", "is", null);
            throwOnError(error);
            const withRate = (rows ?? [])
              .filter((r) => (r.wins ?? 0) + (r.losses ?? 0) >= 10)
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
                .from("players")
                .select(`*, ratings!inner(${config.column})`)
                .order(`ratings(${config.column})`, {
                  ascending: config.ascending,
                })
                .limit(1);

              throwOnError(error);

              const row = data?.[0] as
                | {
                    game_name: string | null;
                    tag_line: string | null;
                    profile_icon: number | null;
                    ratings: { [k: string]: number | null };
                  }
                | undefined;

              if (!row) return [id as HofTitleId, null];

              const value = row.ratings?.[config.column] ?? null;
              return [
                id as HofTitleId,
                {
                  game_name: row.game_name ?? null,
                  tag_line: row.tag_line ?? null,
                  profile_icon: row.profile_icon ?? null,
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
