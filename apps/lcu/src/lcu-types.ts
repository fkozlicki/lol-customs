/** Minimal types for LCU match-history API responses */

export interface LcuMatchSummary {
  gameId: number;
  gameType: string;
}

export interface LcuMatchDetails {
  gameId: number;
  platformId: string;
  gameCreation: number;
  gameDuration: number;
  gameMode: string;
  gameType: string;
  queueId: number;
  mapId: number;
  gameVersion: string;
  seasonId: number;
  endOfGameResult: string;
  participants: LcuParticipant[];
  participantIdentities: LcuParticipantIdentity[];
  teams: LcuTeam[];
}

export interface LcuParticipant {
  participantId: number;
  teamId: number;
  championId: number;
  spell1Id: number;
  spell2Id: number;
  stats: LcuParticipantStats;
  timeline: { lane: string; role: string };
}

export interface LcuParticipantStats {
  champLevel: number;
  kills: number;
  deaths: number;
  assists: number;
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  damageSelfMitigated: number;
  physicalDamageDealt: number;
  magicDamageDealt: number;
  trueDamageDealt: number;
  goldEarned: number;
  goldSpent: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  turretKills: number;
  inhibitorKills: number;
  totalHeal: number;
  totalTimeCrowdControlDealt: number;
  timeCCingOthers: number;
  perkPrimaryStyle: number;
  perkSubStyle: number;
  win: boolean;
}

export interface LcuParticipantIdentity {
  participantId: number;
  player: {
    puuid: string;
    gameName: string;
    tagLine: string;
    profileIcon: number;
    platformId: string;
  };
}

export interface LcuTeam {
  teamId: number;
  win: string;
  baronKills: number;
  dragonKills: number;
  riftHeraldKills: number;
  inhibitorKills: number;
  towerKills: number;
  firstBaron: boolean;
  firstBlood: boolean;
  firstTower: boolean;
}
