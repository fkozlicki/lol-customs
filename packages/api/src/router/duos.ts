import { TRPCError } from "@trpc/server";
import type { Client } from "@v1/supabase/types";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

const duosPerPlayerInput = z
  .object({
    partnerLimit: z.number().min(1).max(20).default(5),
  })
  .optional();

type PlayerInfo = {
  game_name: string | null;
  tag_line: string | null;
  profile_icon: number | null;
};

async function fetchPlayers(
  supabase: Client,
  puuids: string[],
): Promise<Map<string, PlayerInfo>> {
  if (puuids.length === 0) return new Map();
  const uniq = [...new Set(puuids)];
  const { data, error } = await supabase
    .from("players")
    .select("puuid, game_name, tag_line, profile_icon")
    .in("puuid", uniq);
  if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
  const map = new Map<string, PlayerInfo>();
  for (const p of data ?? []) {
    map.set(p.puuid, {
      game_name: p.game_name ?? null,
      tag_line: p.tag_line ?? null,
      profile_icon: p.profile_icon ?? null,
    });
  }
  return map;
}

/** Per-player: teammate puuid -> count (games/wins/losses). Top N by count. */
function buildTeammateCounts(
  rows: Array<{ match_id: number; puuid: string; team_id: number | null; win: boolean | null }>,
  filter: "all" | "win" | "loss",
  partnerLimit: number,
): Map<string, Array<{ puuid: string; count: number }>> {
  const byMatchTeam = new Map<string, string[]>();
  for (const r of rows) {
    if (r.team_id == null) continue;
    if (filter === "win" && !r.win) continue;
    if (filter === "loss" && r.win) continue;
    const key = `${r.match_id}:${r.team_id}`;
    let arr = byMatchTeam.get(key);
    if (!arr) {
      arr = [];
      byMatchTeam.set(key, arr);
    }
    arr.push(r.puuid);
  }
  // For each puuid P, count how many matches they shared with each teammate
  const perPlayer = new Map<string, Map<string, number>>();
  for (const puuids of byMatchTeam.values()) {
    const unique = [...new Set(puuids)];
    for (let i = 0; i < unique.length; i++) {
      const p = unique[i]!;
      let counts = perPlayer.get(p);
      if (!counts) {
        counts = new Map();
        perPlayer.set(p, counts);
      }
      for (let j = 0; j < unique.length; j++) {
        if (i === j) continue;
        const other = unique[j]!;
        counts.set(other, (counts.get(other) ?? 0) + 1);
      }
    }
  }
  const result = new Map<string, Array<{ puuid: string; count: number }>>();
  for (const [puuid, counts] of perPlayer) {
    const sorted = [...counts.entries()]
      .map(([p, c]) => ({ puuid: p, count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, partnerLimit);
    result.set(puuid, sorted);
  }
  return result;
}

/** From match_kills + match_participants: per killer_puuid -> top victim; per victim_puuid -> top killer. */
function buildKillStats(
  kills: Array<{ match_id: number; killer_participant_id: number; victim_participant_id: number }>,
  participantToPuuid: Map<string, string>,
): {
  mostKilled: Map<string, { puuid: string; count: number }>;
  mostlyKilledBy: Map<string, { puuid: string; count: number }>;
} {
  const killerToVictimCount = new Map<string, Map<string, number>>();
  const victimToKillerCount = new Map<string, Map<string, number>>();
  for (const k of kills) {
    const key = `${k.match_id}:${k.killer_participant_id}`;
    const victimKey = `${k.match_id}:${k.victim_participant_id}`;
    const killerPuuid = participantToPuuid.get(key);
    const victimPuuid = participantToPuuid.get(victimKey);
    if (!killerPuuid || !victimPuuid) continue;
    let vc = killerToVictimCount.get(killerPuuid);
    if (!vc) {
      vc = new Map();
      killerToVictimCount.set(killerPuuid, vc);
    }
    vc.set(victimPuuid, (vc.get(victimPuuid) ?? 0) + 1);
    let kc = victimToKillerCount.get(victimPuuid);
    if (!kc) {
      kc = new Map();
      victimToKillerCount.set(victimPuuid, kc);
    }
    kc.set(killerPuuid, (kc.get(killerPuuid) ?? 0) + 1);
  }
  const mostKilled = new Map<string, { puuid: string; count: number }>();
  for (const [killer, counts] of killerToVictimCount) {
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top) mostKilled.set(killer, { puuid: top[0], count: top[1] });
  }
  const mostlyKilledBy = new Map<string, { puuid: string; count: number }>();
  for (const [victim, counts] of victimToKillerCount) {
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top) mostlyKilledBy.set(victim, { puuid: top[0], count: top[1] });
  }
  return { mostKilled, mostlyKilledBy };
}

export const duosRouter = createTRPCRouter({
  duosPerPlayer: publicProcedure.input(duosPerPlayerInput).query(async ({ ctx, input }) => {
    const partnerLimit = input?.partnerLimit ?? 5;

    const { data: mpRows, error: mpError } = await ctx.supabase
      .from("match_participants")
      .select("match_id, puuid, participant_id, team_id, win")
      .limit(500_000);
    if (mpError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: mpError.message });
    const rows = mpRows ?? [];

    const playerPuuidSet = new Set(rows.map((r) => r.puuid));
    const playerPuuids = [...playerPuuidSet];

    const mostGamesWith = buildTeammateCounts(
      rows.map((r) => ({ match_id: r.match_id, puuid: r.puuid, team_id: r.team_id, win: r.win })),
      "all",
      partnerLimit,
    );
    const mostWinsWith = buildTeammateCounts(
      rows.map((r) => ({ match_id: r.match_id, puuid: r.puuid, team_id: r.team_id, win: r.win })),
      "win",
      partnerLimit,
    );
    const mostLossesWith = buildTeammateCounts(
      rows.map((r) => ({ match_id: r.match_id, puuid: r.puuid, team_id: r.team_id, win: r.win })),
      "loss",
      partnerLimit,
    );

    const participantToPuuid = new Map<string, string>();
    for (const r of rows) {
      if (r.participant_id != null) {
        participantToPuuid.set(`${r.match_id}:${r.participant_id}`, r.puuid);
      }
    }

    const { data: killRows, error: killError } = await ctx.supabase
      .from("match_kills")
      .select("match_id, killer_participant_id, victim_participant_id")
      .limit(500_000);
    if (killError) {
      if ((killError as { code?: string }).code === "42P01") {
        return buildPerPlayerResult(
          playerPuuids,
          mostGamesWith,
          mostWinsWith,
          mostLossesWith,
          new Map(),
          new Map(),
          ctx.supabase,
        );
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: killError.message });
    }
    const { mostKilled, mostlyKilledBy } = buildKillStats(killRows ?? [], participantToPuuid);

    return buildPerPlayerResult(
      playerPuuids,
      mostGamesWith,
      mostWinsWith,
      mostLossesWith,
      mostKilled,
      mostlyKilledBy,
      ctx.supabase,
    );
  }),
});

async function buildPerPlayerResult(
  playerPuuids: string[],
  mostGamesWith: Map<string, Array<{ puuid: string; count: number }>>,
  mostWinsWith: Map<string, Array<{ puuid: string; count: number }>>,
  mostLossesWith: Map<string, Array<{ puuid: string; count: number }>>,
  mostKilled: Map<string, { puuid: string; count: number }>,
  mostlyKilledBy: Map<string, { puuid: string; count: number }>,
  supabase: Client,
) {
  const allPartnerPuuids = new Set<string>();
  for (const arr of mostGamesWith.values()) for (const p of arr) allPartnerPuuids.add(p.puuid);
  for (const arr of mostWinsWith.values()) for (const p of arr) allPartnerPuuids.add(p.puuid);
  for (const arr of mostLossesWith.values()) for (const p of arr) allPartnerPuuids.add(p.puuid);
  for (const v of mostKilled.values()) allPartnerPuuids.add(v.puuid);
  for (const v of mostlyKilledBy.values()) allPartnerPuuids.add(v.puuid);
  const players = await fetchPlayers(supabase, [...playerPuuids, ...allPartnerPuuids]);

  return playerPuuids.map((puuid) => {
    const games = mostGamesWith.get(puuid) ?? [];
    const wins = mostWinsWith.get(puuid) ?? [];
    const losses = mostLossesWith.get(puuid) ?? [];
    const killed = mostKilled.get(puuid) ?? null;
    const killedBy = mostlyKilledBy.get(puuid) ?? null;
    return {
      puuid,
      player: players.get(puuid) ?? null,
      mostGamesWith: games.map((g) => ({ puuid: g.puuid, player: players.get(g.puuid) ?? null, count: g.count })),
      mostWinsWith: wins.map((w) => ({ puuid: w.puuid, player: players.get(w.puuid) ?? null, count: w.count })),
      mostLossesWith: losses.map((l) => ({ puuid: l.puuid, player: players.get(l.puuid) ?? null, count: l.count })),
      mostKilled: killed
        ? { puuid: killed.puuid, player: players.get(killed.puuid) ?? null, count: killed.count }
        : null,
      mostlyKilledBy: killedBy
        ? { puuid: killedBy.puuid, player: players.get(killedBy.puuid) ?? null, count: killedBy.count }
        : null,
    };
  });
}
