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
});
