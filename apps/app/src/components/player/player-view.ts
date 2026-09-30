import type { RouterOutputs } from "@v1/api";
import { playerHref } from "@v1/domain/riot-id";
import { formatKda, formatWinrate } from "@v1/domain/stats";
import type {
  ChampionStatView,
  HeldTitleView,
  RatingPointView,
  RelationsView,
  RelationView,
  SeasonMarkerView,
  SeasonSummaryView,
} from "@v1/ui/recipes/player/player-view";
import { format } from "date-fns";
import {
  formatHofValue,
  HOF_TITLES,
  type HofTitleId,
} from "@/components/hof/hof-config";
import { SEASON_PARAM, type SeasonOption, withSeason } from "@/utils/season";

type Relations = RouterOutputs["players"]["relations"];
type Relation = Relations["teammates"]["mostMatches"];
type SeasonSummary = RouterOutputs["players"]["seasonSummaries"][number];
type ChampionStat = RouterOutputs["players"]["mostPlayedChampions"][number];
type RatingPoint = RouterOutputs["players"]["ratingHistory"][number];
type HallOfFame = RouterOutputs["riftRank"]["hallOfFame"];

/** The `?season=` value links carry, as `useSeasonParam` reads it. */
interface SeasonLink {
  season: string | null;
}

export function toRelationView(
  relation: Relation,
  { season }: SeasonLink,
): RelationView | null {
  if (!relation) return null;
  const { player } = relation;
  return {
    name: player.game_name ?? player.puuid.slice(0, 8),
    href: withSeason(playerHref(player.game_name, player.tag_line), season),
    iconId: player.profile_icon,
    matches: relation.matches ?? 0,
    wins: relation.wins ?? 0,
    losses: relation.losses ?? 0,
    kills: relation.kills ?? 0,
  };
}

export function toRelationsView(
  { teammates, rivals }: Relations,
  link: SeasonLink,
): RelationsView {
  const view = (relation: Relation) => toRelationView(relation, link);
  return {
    teammates: {
      mostMatches: view(teammates.mostMatches),
      mostWins: view(teammates.mostWins),
      mostLosses: view(teammates.mostLosses),
    },
    rivals: {
      bestRecord: view(rivals.bestRecord),
      worstRecord: view(rivals.worstRecord),
      mostKilled: view(rivals.mostKilled),
      mostKilledBy: view(rivals.mostKilledBy),
    },
  };
}

/** Every season the player played, newest first, linked to that season's profile. */
export function toSeasonSummaryViews(
  summaries: SeasonSummary[],
  { seasons, active }: { seasons: SeasonOption[]; active: number },
): SeasonSummaryView[] {
  return [...summaries].reverse().map((summary) => ({
    key: String(summary.seasonId),
    seasonNumber:
      seasons.find((s) => s.id === summary.seasonId)?.number ??
      summary.seasonId,
    href: `?${SEASON_PARAM}=${summary.seasonId}`,
    active: summary.seasonId === active,
    wins: summary.wins,
    losses: summary.losses,
    winrate: formatWinrate(summary.wins, summary.losses),
    rating: Math.round(summary.rating ?? 0),
  }));
}

export function toChampionStatViews(
  champions: ChampionStat[],
): ChampionStatView[] {
  return champions.map((champion) => {
    const losses = champion.games - champion.wins;
    return {
      championId: champion.championId,
      matches: champion.games,
      wins: champion.wins,
      losses,
      kda: formatKda(
        champion.kills / champion.games,
        champion.deaths / champion.games,
        champion.assists / champion.games,
      ),
      winrate: formatWinrate(champion.wins, losses),
    };
  });
}

export function toRatingPoints(history: RatingPoint[]): RatingPointView[] {
  return history.map((point, i) => ({
    index: i + 1,
    rating: point.rating_after ?? 0,
    label: point.created_at
      ? format(new Date(point.created_at), "MMM d, HH:mm")
      : `Game ${i + 1}`,
  }));
}

/** The first match of each season on the all-time chart; a season the player skipped has none. */
export function toSeasonMarkers(
  history: RatingPoint[],
  seasonStarts: { number: number; startsAt: string }[],
): SeasonMarkerView[] {
  return seasonStarts.flatMap(({ number, startsAt }) => {
    const startMs = new Date(startsAt).getTime();
    const first = history.findIndex(
      (point) =>
        point.created_at != null &&
        new Date(point.created_at).getTime() >= startMs,
    );
    return first > 0 ? [{ seasonNumber: number, index: first + 1 }] : [];
  });
}

/**
 * The Hall of Fame titles `puuid` holds, in the catalog's order, named and formatted. `text` names a
 * title in the reader's language; the catalog and its words are the app's.
 */
export function toHeldTitles(
  hallOfFame: HallOfFame,
  puuid: string,
  {
    locale,
    href,
    text,
  }: {
    locale: string;
    href: string;
    text: (id: HofTitleId) => { title: string; description: string };
  },
): HeldTitleView[] {
  return HOF_TITLES.flatMap((entry) => {
    const holder = hallOfFame[entry.id]?.find(
      ({ player }) => player.puuid === puuid,
    );
    if (!holder) return [];
    return [
      {
        id: entry.id,
        ...text(entry.id),
        value: formatHofValue(entry, holder.value, locale),
        href,
        kind: entry.kind,
        tone: entry.id === "mvp" ? "mvp" : entry.id === "ace" ? "ace" : null,
      },
    ];
  });
}
