import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const matchesRouter = createTRPCRouter({
  byId: publicProcedure
    .input(z.object({ matchId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("matches")
        .select("*")
        .eq("match_id", input.matchId)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data;
    }),

  recent: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          platformId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      let q = ctx.supabase
        .from("matches")
        .select("*")
        .order("game_creation", { ascending: false })
        .limit(input?.limit ?? 20);
      if (input?.platformId) {
        q = q.eq("platform_id", input.platformId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }),

  recentWithParticipants: publicProcedure
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
      let matchesQ = ctx.supabase
        .from("matches")
        .select("*")
        .order("game_creation", { ascending: false })
        .limit(limit);
      if (input?.platformId) {
        matchesQ = matchesQ.eq("platform_id", input.platformId);
      }
      const { data: matches, error: matchesError } = await matchesQ;
      if (matchesError) throw matchesError;
      if (!matches?.length) return [];
      const matchIds = matches.map((m) => m.match_id);
      const { data: participants, error: partError } = await ctx.supabase
        .from("match_participants")
        .select("*, players(game_name, tag_line, profile_icon)")
        .in("match_id", matchIds);
      if (partError) throw partError;
      const byMatch = new Map<number, typeof participants>();
      for (const p of participants ?? []) {
        const list = byMatch.get(p.match_id) ?? [];
        list.push(p);
        byMatch.set(p.match_id, list);
      }
      return matches.map((match) => ({
        match,
        participants: (byMatch.get(match.match_id) ?? []).sort(
          (a, b) => (a.participant_id ?? 0) - (b.participant_id ?? 0),
        ),
      }));
    }),

  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        platformId: z.string().optional(),
        puuid: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.puuid) {
        const { data: participantRows } = await ctx.supabase
          .from("match_participants")
          .select("match_id")
          .eq("puuid", input.puuid)
          .order("match_id", { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);
        if (!participantRows?.length) return { matches: [], total: 0 };
        const matchIds = participantRows.map((r) => r.match_id);
        const { data: matches, error } = await ctx.supabase
          .from("matches")
          .select("*")
          .in("match_id", matchIds)
          .order("game_creation", { ascending: false });
        if (error) throw error;
        return { matches: matches ?? [], total: matchIds.length };
      }
      let q = ctx.supabase
        .from("matches")
        .select("*", { count: "exact" })
        .order("game_creation", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);
      if (input.platformId) {
        q = q.eq("platform_id", input.platformId);
      }
      const { data, error, count } = await q;
      if (error) throw error;
      return { matches: data ?? [], total: count ?? 0 };
    }),
});
