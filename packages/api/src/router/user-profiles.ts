import {
  getUserProfile,
  saveUserProfile,
} from "@v1/supabase/queries/user-profiles";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userProfilesRouter = createTRPCRouter({
  me: publicProcedure.query(({ ctx }) =>
    ctx.user ? getUserProfile(ctx.supabase, ctx.user.id) : null,
  ),

  /** A taken nickname is a unique violation, which reaches the client as CONFLICT. */
  setup: protectedProcedure
    .input(
      z.object({
        nickname: z.string().min(2).max(30),
        avatar_url: z.string().url().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      saveUserProfile(ctx.supabase, {
        id: ctx.user.id,
        nickname: input.nickname,
        avatar_url: input.avatar_url ?? null,
      }),
    ),
});
