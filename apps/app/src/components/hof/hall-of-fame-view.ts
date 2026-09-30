import type { RouterOutputs } from "@v1/api";
import { playerHref } from "@v1/domain/riot-id";
import type {
  CollectorView,
  HallOfFameView,
  HofPlayerView,
  TitleView,
} from "@v1/ui/recipes/hof/hall-of-fame-view";
import { withSeason } from "@/utils/season";
import {
  formatHofValue,
  HOF_SECTIONS,
  HOF_TITLES,
  type HofSectionId,
  type HofStatId,
  type HofTitle,
  type HofTitleId,
} from "./hof-config";

type HallOfFameData = RouterOutputs["riftRank"]["hallOfFame"];
type HofPlayer = HallOfFameData[string][number]["player"];

/** The catalog's words in the reader's language. */
export interface HofText {
  section: (id: HofSectionId) => string;
  title: (id: HofTitleId) => string;
  stat: (id: HofStatId) => string;
}

interface Options {
  locale: string;
  /** The `?season=` value player links carry. */
  season: string | null;
  text: HofText;
}

/** Whether anybody holds any title on this track; early in a season nobody does. */
export function hasTitleHolders(data: HallOfFameData): boolean {
  return HOF_TITLES.some((entry) => (data[entry.id]?.length ?? 0) > 0);
}

/**
 * `riftRank.hallOfFame` laid out by the catalog: each title named and formatted with its holders, the
 * unpaired titles nobody holds left out (and a section with nothing left, dropped), and the players who
 * collect the most best and worst titles.
 */
export function toHallOfFameView(
  data: HallOfFameData,
  { locale, season, text }: Options,
): HallOfFameView {
  const player = (p: HofPlayer): HofPlayerView => ({
    key: p.puuid,
    name: p.game_name ?? p.puuid.slice(0, 8),
    href: withSeason(playerHref(p.game_name, p.tag_line), season),
    iconId: p.profile_icon,
  });

  const title = (entry: HofTitle): TitleView => {
    const holders = data[entry.id] ?? [];
    const [holder] = holders;
    return {
      id: entry.id,
      title: text.title(entry.id),
      statLabel: text.stat(entry.stat),
      tone: entry.id === "mvp" ? "mvp" : entry.id === "ace" ? "ace" : null,
      holders: holders.map(({ player: p }) => player(p)),
      value: holder ? formatHofValue(entry, holder.value, locale) : null,
    };
  };

  const held = (entry: HofTitle) => (data[entry.id]?.length ?? 0) > 0;

  const sections = HOF_SECTIONS.map((section) => ({
    id: section.id,
    name: text.section(section.id),
    pairs: section.pairs.map(
      (pair) => [title(pair.best), title(pair.worst)] as [TitleView, TitleView],
    ),
    singles: (section.singles ?? []).filter(held).map(title),
  })).filter(
    (section) => section.pairs.length > 0 || section.singles.length > 0,
  );

  const counts = new Map<
    string,
    { player: HofPlayer; best: number; worst: number }
  >();
  for (const entry of HOF_TITLES) {
    for (const { player: p } of data[entry.id] ?? []) {
      const count = counts.get(p.puuid) ?? { player: p, best: 0, worst: 0 };
      count[entry.kind] += 1;
      counts.set(p.puuid, count);
    }
  }
  const top = (kind: "best" | "worst"): CollectorView[] =>
    [...counts.values()]
      .filter((count) => count[kind] > 0)
      .sort(
        (a, b) =>
          b[kind] - a[kind] ||
          (a.player.game_name ?? "").localeCompare(b.player.game_name ?? ""),
      )
      .slice(0, 3)
      .map((count) => ({ player: player(count.player), titles: count[kind] }));

  return { mostBest: top("best"), mostWorst: top("worst"), sections };
}
