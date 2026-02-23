import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const matchesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("matches")
        .select(
          "*, teams(*), match_participants(*, players(game_name, tag_line, profile_icon))",
        )
        .order("game_creation", { ascending: false })
        .limit(input.limit + 1);

      if (input.cursor) {
        query = query.lt("game_creation", input.cursor);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const items = data.map((m) => ({
        ...m,
        match_participants: m.match_participants.sort(
          (a, b) => (a.participant_id ?? 0) - (b.participant_id ?? 0),
        ),
      }));

      const hasNextPage = items.length > input.limit;
      const lastItem = hasNextPage ? items[input.limit - 1] : undefined;
      const nextCursor = lastItem?.game_creation ?? null;

      return {
        items: items.slice(0, input.limit),
        nextCursor,
      };
    }),

  listByPuuid: publicProcedure
    .input(
      z.object({
        puuid: z.string().min(1),
        cursor: z.number().nullish(),
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Step 1: get match IDs for the player, paginated by match_id (monotonically increasing)
      let participantQuery = ctx.supabase
        .from("match_participants")
        .select("match_id")
        .eq("puuid", input.puuid)
        .order("match_id", { ascending: false })
        .limit(input.limit + 1);

      if (input.cursor != null) {
        participantQuery = participantQuery.lt("match_id", input.cursor);
      }

      const { data: participantRows, error: participantError } =
        await participantQuery;

      if (participantError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: participantError.message,
        });
      }

      const hasNextPage = participantRows.length > input.limit;
      const rows = participantRows.slice(0, input.limit);
      const matchIds = rows.map((r) => r.match_id);

      if (matchIds.length === 0) {
        return { items: [], nextCursor: null };
      }

      // Step 2: fetch full match data with all participants
      const { data, error } = await ctx.supabase
        .from("matches")
        .select(
          "*, teams(*), match_participants(*, players(game_name, tag_line, profile_icon))",
        )
        .in("match_id", matchIds)
        .order("game_creation", { ascending: false });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const items = data.map((m) => ({
        ...m,
        match_participants: m.match_participants.sort(
          (a, b) => (a.participant_id ?? 0) - (b.participant_id ?? 0),
        ),
      }));

      const lastMatchId = hasNextPage ? rows[rows.length - 1]?.match_id : null;

      return { items, nextCursor: lastMatchId ?? null };
    }),
});
