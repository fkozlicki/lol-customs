import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userProfilesRouter = createTRPCRouter({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;

    const { data, error } = await ctx.supabase
      .from("user_profiles")
      .select("*")
      .eq("id", ctx.user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return data;
  }),

  setup: protectedProcedure
    .input(
      z.object({
        nickname: z.string().min(2).max(30),
        avatar_url: z.string().url().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("user_profiles")
        .upsert({
          id: ctx.user.id,
          nickname: input.nickname,
          avatar_url: input.avatar_url ?? null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This nickname is already taken.",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data;
    }),
});
