import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const matchesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          platformId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const { data, error } = await ctx.supabase
        .from("matches")
        .select(
          "*, teams(*), match_participants(*, players(game_name, tag_line, profile_icon))",
        )
        .order("game_creation", { ascending: false })
        .limit(limit);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data.map((m) => ({
        ...m,
        match_participants: m.match_participants.sort(
          (a, b) => (a.participant_id ?? 0) - (b.participant_id ?? 0),
        ),
      }));
    }),
});
