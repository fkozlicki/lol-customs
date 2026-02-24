import { TRPCError } from "@trpc/server";
import type { Json } from "@v1/supabase/types";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const forumRouter = createTRPCRouter({
  posts: createTRPCRouter({
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { limit, cursor } = input;

        let query = ctx.supabase
          .from("forum_posts")
          .select(
            `
            id,
            title,
            content,
            created_at,
            author:user_profiles!author_id(id, nickname, avatar_url),
            reactions:forum_reactions(type),
            comments:forum_comments(id)
          `,
          )
          .order("created_at", { ascending: false })
          .limit(limit + 1);

        if (cursor) {
          query = query.lt("created_at", cursor);
        }

        const { data, error } = await query;

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        const items = data ?? [];
        let nextCursor: string | undefined;
        if (items.length > limit) {
          const nextItem = items.pop();
          nextCursor = nextItem?.created_at ?? undefined;
        }

        return {
          items: items.map((post) => {
            const reactions = Array.isArray(post.reactions)
              ? post.reactions
              : [];
            return {
              ...post,
              likes: reactions.filter((r) => r.type === "like").length,
              dislikes: reactions.filter((r) => r.type === "dislike").length,
              commentCount: Array.isArray(post.comments)
                ? post.comments.length
                : 0,
            };
          }),
          nextCursor,
        };
      }),

    get: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from("forum_posts")
          .select(
            `
            id,
            title,
            content,
            created_at,
            author:user_profiles!author_id(id, nickname, avatar_url),
            reactions:forum_reactions(type, user_id),
            comments:forum_comments(id)
          `,
          )
          .eq("id", input.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") return null;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        const reactions = Array.isArray(data.reactions) ? data.reactions : [];
        return {
          ...data,
          likes: reactions.filter((r) => r.type === "like").length,
          dislikes: reactions.filter((r) => r.type === "dislike").length,
          commentCount: Array.isArray(data.comments) ? data.comments.length : 0,
          reactions,
        };
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(200),
          content: z.record(z.string(), z.unknown()),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { data: profile, error: profileError } = await ctx.supabase
          .from("user_profiles")
          .select("id")
          .eq("id", ctx.user.id)
          .single();

        if (profileError || !profile) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You must set up a profile before posting.",
          });
        }

        const { data, error } = await ctx.supabase
          .from("forum_posts")
          .insert({
            author_id: ctx.user.id,
            title: input.title,
            content: input.content as Json,
          })
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        return data;
      }),
  }),

  reactions: createTRPCRouter({
    toggle: protectedProcedure
      .input(
        z.object({
          postId: z.string().uuid(),
          type: z.enum(["like", "dislike"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { data: existing } = await ctx.supabase
          .from("forum_reactions")
          .select("type")
          .eq("post_id", input.postId)
          .eq("user_id", ctx.user.id)
          .single();

        if (existing) {
          if (existing.type === input.type) {
            // same reaction — remove it
            await ctx.supabase
              .from("forum_reactions")
              .delete()
              .eq("post_id", input.postId)
              .eq("user_id", ctx.user.id);
            return { action: "removed" as const };
          }
          // different reaction — update it
          await ctx.supabase
            .from("forum_reactions")
            .update({ type: input.type })
            .eq("post_id", input.postId)
            .eq("user_id", ctx.user.id);
          return { action: "updated" as const };
        }

        // no existing reaction — insert
        await ctx.supabase.from("forum_reactions").insert({
          post_id: input.postId,
          user_id: ctx.user.id,
          type: input.type,
        });
        return { action: "added" as const };
      }),
  }),

  comments: createTRPCRouter({
    list: publicProcedure
      .input(
        z.object({
          postId: z.string().uuid(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        let query = ctx.supabase
          .from("forum_comments")
          .select(
            `
            id,
            content,
            created_at,
            author:user_profiles!author_id(id, nickname, avatar_url),
            reactions:forum_comment_reactions(type, user_id)
          `,
          )
          .eq("post_id", input.postId)
          .order("created_at", { ascending: true })
          .limit(input.limit + 1);

        if (input.cursor) {
          query = query.gt("created_at", input.cursor);
        }

        const { data, error } = await query;

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        const items = data ?? [];
        let nextCursor: string | undefined;
        if (items.length > input.limit) {
          const nextItem = items.pop();
          nextCursor = nextItem?.created_at ?? undefined;
        }

        return {
          items: items.map((comment) => {
            const reactions = Array.isArray(comment.reactions)
              ? comment.reactions
              : [];
            return {
              ...comment,
              likes: reactions.filter((r) => r.type === "like").length,
              dislikes: reactions.filter((r) => r.type === "dislike").length,
              reactions,
            };
          }),
          nextCursor,
        };
      }),

    create: protectedProcedure
      .input(
        z.object({
          postId: z.string().uuid(),
          content: z.record(z.string(), z.unknown()),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from("forum_comments")
          .insert({
            post_id: input.postId,
            author_id: ctx.user.id,
            content: input.content as Json,
          })
          .select(
            `
            id,
            content,
            created_at,
            author:user_profiles!author_id(id, nickname, avatar_url)
          `,
          )
          .single();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        return data;
      }),
  }),

  commentReactions: createTRPCRouter({
    toggle: protectedProcedure
      .input(
        z.object({
          commentId: z.string().uuid(),
          type: z.enum(["like", "dislike"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { data: existing } = await ctx.supabase
          .from("forum_comment_reactions")
          .select("type")
          .eq("comment_id", input.commentId)
          .eq("user_id", ctx.user.id)
          .single();

        if (existing) {
          if (existing.type === input.type) {
            await ctx.supabase
              .from("forum_comment_reactions")
              .delete()
              .eq("comment_id", input.commentId)
              .eq("user_id", ctx.user.id);
            return { action: "removed" as const };
          }
          await ctx.supabase
            .from("forum_comment_reactions")
            .update({ type: input.type })
            .eq("comment_id", input.commentId)
            .eq("user_id", ctx.user.id);
          return { action: "updated" as const };
        }

        await ctx.supabase.from("forum_comment_reactions").insert({
          comment_id: input.commentId,
          user_id: ctx.user.id,
          type: input.type,
        });
        return { action: "added" as const };
      }),
  }),
});
