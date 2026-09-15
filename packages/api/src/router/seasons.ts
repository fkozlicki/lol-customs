import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const seasonsRouter = createTRPCRouter({
  /** Ladder seasons, oldest first. `starts_at` is null for the open-ended first season. */
  list: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("seasons")
      .select("id, number, starts_at")
      .order("starts_at", { ascending: true });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    const now = Date.now();
    const seasons = data.map((s) => {
      const startsAt = new Date(s.starts_at);
      return {
        id: s.id,
        number: s.number,
        starts_at: Number.isNaN(startsAt.getTime())
          ? null
          : startsAt.toISOString(),
      };
    });
    const current = [...seasons]
      .reverse()
      .find(
        (s) => s.starts_at === null || new Date(s.starts_at).getTime() <= now,
      );

    return seasons.map((s) => ({ ...s, isCurrent: s.id === current?.id }));
  }),
});
