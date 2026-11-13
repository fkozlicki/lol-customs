import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

/**
 * A post's or comment's body as the forum's CHECK constraint accepts it: the editor's document, or an
 * empty object for a post without a body. The client sends the editor's JSON as it is.
 */
const forumContent = z.record(z.string(), z.unknown()).pipe(
  z.union([
    z.strictObject({}),
    z.looseObject({
      type: z.literal("doc"),
      content: z.array(z.looseObject({ type: z.string() })),
    }),
  ]),
);

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

        if (error) throw error;

        const items = data.map((post) => {
          const reactions = Array.isArray(post.reactions) ? post.reactions : [];
          return {
            ...post,
            likes: reactions.filter((r) => r.type === "like").length,
            dislikes: reactions.filter((r) => r.type === "dislike").length,
            commentCount: Array.isArray(post.comments)
              ? post.comments.length
              : 0,
          };
        });

        const hasNextPage = items.length > limit;
        const lastItem = hasNextPage ? items[limit - 1] : undefined;
        const nextCursor = lastItem?.created_at ?? null;

        return {
          items: items.slice(0, limit),
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
          .maybeSingle();

        if (error) throw error;
        if (!data) return null;

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
          content: forumContent,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { data: profile, error: profileError } = await ctx.supabase
          .from("user_profiles")
          .select("id")
          .eq("id", ctx.user.id)
          .maybeSingle();
        if (profileError) throw profileError;

        if (!profile) {
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
            content: input.content,
          })
          .select()
          .single();

        if (error) throw error;

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
        const { data: existing, error: existingError } = await ctx.supabase
          .from("forum_reactions")
          .select("type")
          .eq("post_id", input.postId)
          .eq("user_id", ctx.user.id)
          .maybeSingle();
        if (existingError) throw existingError;

        if (existing) {
          if (existing.type === input.type) {
            // same reaction — remove it
            const { error } = await ctx.supabase
              .from("forum_reactions")
              .delete()
              .eq("post_id", input.postId)
              .eq("user_id", ctx.user.id);
            if (error) throw error;
            return { action: "removed" as const };
          }
          // different reaction — update it
          const { error } = await ctx.supabase
            .from("forum_reactions")
            .update({ type: input.type })
            .eq("post_id", input.postId)
            .eq("user_id", ctx.user.id);
          if (error) throw error;
          return { action: "updated" as const };
        }

        // no existing reaction — insert
        const { error } = await ctx.supabase.from("forum_reactions").insert({
          post_id: input.postId,
          user_id: ctx.user.id,
          type: input.type,
        });
        if (error) throw error;
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

        if (error) throw error;

        const items = data.map((comment) => {
          const reactions = Array.isArray(comment.reactions)
            ? comment.reactions
            : [];
          return {
            ...comment,
            likes: reactions.filter((r) => r.type === "like").length,
            dislikes: reactions.filter((r) => r.type === "dislike").length,
            reactions,
          };
        });

        const hasNextPage = items.length > input.limit;
        const lastItem = hasNextPage ? items[input.limit - 1] : undefined;
        const nextCursor = lastItem?.created_at ?? null;

        return {
          items: items.slice(0, input.limit),
          nextCursor,
        };
      }),

    create: protectedProcedure
      .input(
        z.object({
          postId: z.string().uuid(),
          content: forumContent,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from("forum_comments")
          .insert({
            post_id: input.postId,
            author_id: ctx.user.id,
            content: input.content,
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

        if (error) throw error;

        return data;
      }),
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
      .input(
        z.object({
          commentId: z.string().uuid(),
          type: z.enum(["like", "dislike"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { data: existing, error: existingError } = await ctx.supabase
          .from("forum_comment_reactions")
          .select("type")
          .eq("comment_id", input.commentId)
          .eq("user_id", ctx.user.id)
          .maybeSingle();
        if (existingError) throw existingError;

        if (existing) {
          if (existing.type === input.type) {
            const { error } = await ctx.supabase
              .from("forum_comment_reactions")
              .delete()
              .eq("comment_id", input.commentId)
              .eq("user_id", ctx.user.id);
            if (error) throw error;
            return { action: "removed" as const };
          }
          const { error } = await ctx.supabase
            .from("forum_comment_reactions")
            .update({ type: input.type })
            .eq("comment_id", input.commentId)
            .eq("user_id", ctx.user.id);
          if (error) throw error;
          return { action: "updated" as const };
        }

        const { error } = await ctx.supabase
          .from("forum_comment_reactions")
          .insert({
            comment_id: input.commentId,
            user_id: ctx.user.id,
            type: input.type,
          });

        if (error) throw error;
        return { action: "added" as const };
      }),
  }),
});
