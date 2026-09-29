import type { RouterOutputs } from "@v1/api";
import { formatRank } from "@v1/domain/rank";
import { playerHref } from "@v1/domain/riot-id";
import { formatDuration, formatKdaRatio } from "@v1/domain/stats";
import type { Side } from "@v1/ui/recipes/game-assets/asset-urls";
import type {
  MatchCardView,
  ParticipantView,
  SideView,
} from "@v1/ui/recipes/matches/match-view";
import { withSeason } from "@/utils/season";

export type Match = RouterOutputs["matches"]["list"]["items"][number];
export type MatchParticipant = Match["match_participants"][number];

/** The part of Riot's stored match JSON the cards read: spells and items per participant. */
export interface RawParticipant {
  stats: {
    item0: number;
    item1: number;
    item2: number;
    item3: number;
    item4: number;
    item5: number;
    item6: number;
    perk0: number;
    perk1: number;
    perk2: number;
    perk3: number;
    perk4: number;
    perk5: number;
    perkPrimaryStyle?: number;
  };
  participantId: number;
  spell1Id: number;
  spell2Id: number;
}

export interface RawJson {
  participants: RawParticipant[];
}

interface Options {
  /** The profile owner, when the card is told from their point of view. */
  puuid?: string;
  /** The `?season=` value every player link carries, as `useSeasonParam` reads it. */
  season: string | null;
}

const SIDES: readonly [Side, number][] = [
  ["blue", 100],
  ["red", 200],
];

/**
 * A `matches.list` row as the match recipes take it. Everything the cards used to work out for
 * themselves — sides, kill participation, OP place, damage shares, who is MVP, the season-aware
 * profile links — is worked out here, once, where it can be tested.
 */
export function toMatchCardView(
  match: Match,
  { puuid, season }: Options,
): MatchCardView {
  const participants = match.match_participants ?? [];
  const raw = (match.raw_json as unknown as RawJson | null)?.participants ?? [];
  const scores = participants
    .map((p) => p.op_score)
    .filter((score): score is number => score != null);
  const highestDamageDealt = Math.max(
    0,
    ...participants.map((p) => p.total_damage_dealt_to_champions ?? 0),
  );
  const highestDamageTaken = Math.max(
    0,
    ...participants.map((p) => p.total_damage_taken ?? 0),
  );
  const sideKills = (teamId: number | null) =>
    participants
      .filter((p) => p.team_id === teamId)
      .reduce((sum, p) => sum + (p.kills ?? 0), 0);

  const toParticipant = (p: MatchParticipant): ParticipantView => {
    const rawData = raw.find((r) => r.participantId === p.participant_id);
    const kills = p.kills ?? 0;
    const deaths = p.deaths ?? 0;
    const assists = p.assists ?? 0;
    const teamKills = sideKills(p.team_id);
    const ratio = formatKdaRatio(p.kills, p.deaths, p.assists);
    const cs = (p.total_minions_killed ?? 0) + (p.neutral_minions_killed ?? 0);
    const opScore = p.op_score;

    return {
      key: p.puuid,
      name: p.players?.game_name ?? "",
      href: withSeason(
        playerHref(p.players?.game_name, p.players?.tag_line),
        season,
      ),
      side: p.team_id === 100 ? "blue" : "red",
      win: p.win === true,
      championId: p.champion_id,
      level: p.champ_level ?? null,
      spellIds: [rawData?.spell1Id, rawData?.spell2Id].filter(
        (id): id is number => id != null && id !== 0,
      ),
      itemIds: rawData
        ? [
            rawData.stats.item0,
            rawData.stats.item1,
            rawData.stats.item2,
            rawData.stats.item3,
            rawData.stats.item4,
            rawData.stats.item5,
            rawData.stats.item6,
          ]
        : Array.from({ length: 7 }, () => null),
      rankTier: p.rank_tier,
      rankLabel: formatRank(
        p.rank_tier?.toLowerCase() ?? null,
        p.rank_division,
      ),
      kills,
      deaths,
      assists,
      kdaRatio: ratio === "Perfect" ? null : ratio,
      killParticipation:
        teamKills > 0 ? Math.round(((kills + assists) / teamKills) * 100) : 0,
      opScore,
      place:
        opScore != null ? 1 + scores.filter((s) => s > opScore).length : null,
      badge: p.is_mvp ? "mvp" : p.is_ace ? "ace" : null,
      damageDealt: p.total_damage_dealt_to_champions ?? 0,
      damageTaken: p.total_damage_taken ?? 0,
      damageDealtShare: share(
        p.total_damage_dealt_to_champions ?? 0,
        highestDamageDealt,
      ),
      damageTakenShare: share(p.total_damage_taken ?? 0, highestDamageTaken),
      wardsPlaced: p.wards_placed ?? 0,
      wardsKilled: p.wards_killed ?? 0,
      cs,
      csPerMinute: match.duration > 0 ? cs / (match.duration / 60) : 0,
      ratingChange: p.rating_change ?? null,
    };
  };

  const views = participants.map(toParticipant);

  const [blue, red] = SIDES.map(([side, teamId]): SideView => {
    const team = match.teams?.find((t) => t.team_id === teamId);
    const members = participants.filter((p) => p.team_id === teamId);

    return {
      side,
      won: team?.win ?? members.some((p) => p.win),
      kills: sideKills(teamId),
      gold: members.reduce((sum, p) => sum + (p.gold_earned ?? 0), 0),
      objectives: {
        baronKills: team?.baron_kills ?? 0,
        dragonKills: team?.dragon_kills ?? 0,
        heraldKills: team?.rift_herald_kills ?? 0,
        inhibitorKills: team?.inhibitor_kills ?? 0,
        towerKills: team?.tower_kills ?? 0,
      },
      participants: views.filter((v) => v.side === side),
    };
  }) as [SideView, SideView];

  return {
    id: match.match_id,
    duration: formatDuration(match.duration),
    createdAt: match.game_creation,
    blue,
    red,
    player: puuid ? (views.find((v) => v.key === puuid) ?? null) : null,
    mvp: views.find((v) => v.badge === "mvp") ?? null,
    ace: views.find((v) => v.badge === "ace") ?? null,
  };
}

function share(value: number, highest: number): number {
  return highest > 0 ? (value / highest) * 100 : 0;
}
