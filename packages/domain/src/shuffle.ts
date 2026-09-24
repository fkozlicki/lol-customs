import { averageSoloRankMeta } from "./rank";

/** The five roles a drawn team fills, in the order a side is listed. */
export const TEAM_ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

/** A player on the shuffle roster; the rank is the last one recorded in a ladder match. */
export interface RosterPlayer {
  gameName: string;
  tagLine: string;
  rankTier: string | null;
  rankDivision: string | null;
}

export interface RandomTeamsTeamPlayer extends RosterPlayer {
  role: string;
  isCaptain: boolean;
}

export interface RandomTeamsTeam {
  avgRankLabel: string;
  avgRankTier: string | null;
  players: RandomTeamsTeamPlayer[];
}

export interface RandomTeamsResult {
  teamA: RandomTeamsTeam;
  teamB: RandomTeamsTeam;
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

/** A draw needs two full sides. */
export const ROSTER_SIZE = 10;
const TEAM_SIZE = ROSTER_SIZE / 2;

/** Plain draw: sides, roles and captains are random, nothing is balanced. */
export function buildRandomTeams(roster: RosterPlayer[]): RandomTeamsResult {
  if (roster.length !== ROSTER_SIZE) {
    throw new Error(
      `A draw needs exactly ${ROSTER_SIZE} players, got ${roster.length}.`,
    );
  }

  const shuffled = shuffleArray(roster);

  const buildTeam = (members: RosterPlayer[]): RandomTeamsTeam => {
    const roles = shuffleArray(TEAM_ROLES);
    const captainIndex = Math.floor(Math.random() * members.length);
    const players = members
      .map((member, index) => ({
        ...member,
        role: roles[index] as string,
        isCaptain: index === captainIndex,
      }))
      .sort(
        (a, b) =>
          TEAM_ROLES.indexOf(a.role as TeamRole) -
          TEAM_ROLES.indexOf(b.role as TeamRole),
      );
    const average = averageSoloRankMeta(
      members.map((m) => ({ tier: m.rankTier, division: m.rankDivision })),
    );
    return {
      avgRankLabel: average.label,
      avgRankTier: average.tier,
      players,
    };
  };

  return {
    teamA: buildTeam(shuffled.slice(0, TEAM_SIZE)),
    teamB: buildTeam(shuffled.slice(TEAM_SIZE, ROSTER_SIZE)),
  };
}
