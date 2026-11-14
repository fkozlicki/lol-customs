import { TRPCError } from "@trpc/server";
import {
  createComment,
  createPost,
  getPost,
  listComments,
  listPosts,
  toggleReaction,
} from "@v1/supabase/queries/forum";
import { hasUserProfile } from "@v1/supabase/queries/user-profiles";
import { forumContent } from "@v1/supabase/types";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

/** A post's or comment's body: the client sends the editor's JSON as it is, checked here. */
const forumContentInput = z.record(z.string(), z.unknown()).pipe(forumContent);

const reactionType = z.enum(["like", "dislike"]);

export const forumRouter = createTRPCRouter({
  posts: createTRPCRouter({
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(),
        }),
      )
      .query(({ ctx, input }) => listPosts(ctx.supabase, input)),

    get: publicProcedure
      .input(z.object({ id: z.uuid() }))
      .query(({ ctx, input }) => getPost(ctx.supabase, input.id)),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(200),
          content: forumContentInput,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!(await hasUserProfile(ctx.supabase, ctx.user.id))) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You must set up a profile before posting.",
          });
        }
        return createPost(ctx.supabase, {
          author_id: ctx.user.id,
          title: input.title,
          content: input.content,
        });
      }),
  }),

  reactions: createTRPCRouter({
    toggle: protectedProcedure
      .input(z.object({ postId: z.uuid(), type: reactionType }))
      .mutation(({ ctx, input }) =>
        toggleReaction(
          ctx.supabase,
          { postId: input.postId },
          ctx.user.id,
          input.type,
        ),
      ),
  }),

  comments: createTRPCRouter({
    list: publicProcedure
      .input(
        z.object({
          postId: z.uuid(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        }),
      )
      .query(({ ctx, input }) => listComments(ctx.supabase, input)),

    create: protectedProcedure
      .input(z.object({ postId: z.uuid(), content: forumContentInput }))
      .mutation(({ ctx, input }) =>
        createComment(ctx.supabase, {
          post_id: input.postId,
          author_id: ctx.user.id,
          content: input.content,
        }),
      ),
  }),

  images: createTRPCRouter({
    checkNsfw: protectedProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }) => {
        const token = process.env.HUGGING_FACE_TOKEN;
        if (!token) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "HUGGING_FACE_TOKEN is not configured",
          });
        }

        const imgRes = await fetch(input.url);
        if (!imgRes.ok) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Could not fetch image for NSFW check",
          });
        }
        const blob = await imgRes.arrayBuffer();

        const hfRes = await fetch(
          "https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/octet-stream",
            },
            body: blob,
          },
        );

        if (!hfRes.ok) {
          // If HF API fails (e.g. model cold-starting), fail closed
          return { isNsfw: true };
        }

        const results: { label: string; score: number }[] = await hfRes.json();
        const nsfwScore = results.find((r) => r.label === "nsfw")?.score ?? 0;
        return { isNsfw: nsfwScore > 0.5 };
      }),
  }),

  commentReactions: createTRPCRouter({
    toggle: protectedProcedure
      .input(z.object({ commentId: z.uuid(), type: reactionType }))
      .mutation(({ ctx, input }) =>
        toggleReaction(
          ctx.supabase,
          { commentId: input.commentId },
          ctx.user.id,
          input.type,
        ),
      ),
  }),
});
