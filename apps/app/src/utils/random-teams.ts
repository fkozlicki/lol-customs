import type { RouterOutputs } from "@v1/api";
import { averageSoloRankMeta } from "@/utils/rank";

const RANKED_SOLO_QUEUE = "RANKED_SOLO_5x5";

const TEAM_ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"] as const;

type LeagueEntry = RouterOutputs["riot"]["getPlayerRankByRiotId"][number];

export type RosterRankRow =
  RouterOutputs["riot"]["loadRosterRanks"]["players"][number];

export interface EnrichedRosterPlayer {
  gameName: string;
  tagLine: string;
  platformId: string;
  soloTier: string | null;
  soloDivision: string | null;
  soloRankLabel: string;
}

export interface RandomTeamsTeamPlayer {
  gameName: string;
  tagLine: string;
  platformId: string;
  role: string;
  isCaptain: boolean;
  soloTier: string | null;
  soloRankLabel: string;
}

export interface RandomTeamsTeam {
  avgSoloRank: string;
  avgSoloTier: string | null;
  players: RandomTeamsTeamPlayer[];
}

export interface RandomTeamsResult {
  teamA: RandomTeamsTeam;
  teamB: RandomTeamsTeam;
}

function formatSoloRankDisplay(tier: string, rankDivision: string): string {
  const apex = ["MASTER", "GRANDMASTER", "CHALLENGER"];
  if (apex.includes(tier.toUpperCase())) return tier;
  return `${tier} ${rankDivision}`.trim();
}

function soloSnapshotFromEntries(entries: LeagueEntry[]): {
  tier: string | null;
  division: string | null;
  label: string;
} {
  const solo = entries.find((e) => e.queueType === RANKED_SOLO_QUEUE);
  const tier = solo?.tier?.trim() ? solo.tier : null;
  const division = solo?.rank?.trim() ? solo.rank : null;
  if (!tier) {
    return { tier: null, division: null, label: "" };
  }
  if (!division) {
    return { tier, division: null, label: tier };
  }
  return {
    tier,
    division,
    label: formatSoloRankDisplay(tier, division),
  };
}

function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = tmp;
  }
  return copy;
}

export function enrichPlayersFromRankLoad(load: {
  players: RosterRankRow[];
}): EnrichedRosterPlayer[] {
  return load.players.map((row) => {
    const snap = soloSnapshotFromEntries(row.entries);
    return {
      gameName: row.gameName,
      tagLine: row.tagLine,
      platformId: row.platformId,
      soloTier: snap.tier,
      soloDivision: snap.division,
      soloRankLabel: snap.label,
    };
  });
}

export function buildRandomTeams(
  enriched: EnrichedRosterPlayer[],
): RandomTeamsResult {
  const shuffled = shuffleArray(enriched);
  const teamAPlayers = shuffled.slice(0, 5);
  const teamBPlayers = shuffled.slice(5, 10);
  const rolesA = shuffleArray(TEAM_ROLES);
  const rolesB = shuffleArray(TEAM_ROLES);
  const captainA = Math.floor(Math.random() * 5);
  const captainB = Math.floor(Math.random() * 5);

  const buildTeam = (
    members: EnrichedRosterPlayer[],
    roles: (typeof TEAM_ROLES)[number][],
    captainIndex: number,
  ): RandomTeamsTeam => {
    const players = members
      .map((m, i) => ({
        gameName: m.gameName,
        tagLine: m.tagLine,
        platformId: m.platformId,
        role: roles[i] as string,
        isCaptain: i === captainIndex,
        soloTier: m.soloTier,
        soloRankLabel: m.soloRankLabel,
      }))
      .sort((a, b) => {
        const ai = TEAM_ROLES.indexOf(a.role as (typeof TEAM_ROLES)[number]);
        const bi = TEAM_ROLES.indexOf(b.role as (typeof TEAM_ROLES)[number]);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
    const avgMeta = averageSoloRankMeta(
      members.map((m) => ({
        tier: m.soloTier,
        division: m.soloDivision,
      })),
    );
    return {
      avgSoloRank: avgMeta.label,
      avgSoloTier: avgMeta.tier,
      players,
    };
  };

  return {
    teamA: buildTeam(teamAPlayers, rolesA, captainA),
    teamB: buildTeam(teamBPlayers, rolesB, captainB),
  };
}
