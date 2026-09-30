import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchList } from "@v1/ui/recipes/matches/match-list";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { MostPlayedChampions } from "@v1/ui/recipes/player/most-played-champions";
import { PlayerHeader } from "@v1/ui/recipes/player/player-header";
import { PlayerProfileLayout } from "@v1/ui/recipes/player/player-profile-layout";
import { PlayerRelations } from "@v1/ui/recipes/player/player-relations";
import { PlayerSeasonEmpty } from "@v1/ui/recipes/player/player-season-empty";
import { PlayerSeasonOverview } from "@v1/ui/recipes/player/player-season-overview";
import { PlayerSeasonSummaries } from "@v1/ui/recipes/player/player-season-summaries";
import { PlayerStats } from "@v1/ui/recipes/player/player-stats";
import { PlayerTitles } from "@v1/ui/recipes/player/player-titles";
import { RatingHistoryChart } from "@v1/ui/recipes/player/rating-history-chart";
import { fn } from "storybook/test";
import { slots } from "../../controls";
import { QUALIFICATION_MATCHES, STANDINGS } from "../home/standings.fixtures";
import { MATCH_CARD } from "../matches/match.fixtures";
import {
  CHAMPIONS,
  RATING_POINTS,
  RELATIONS,
  SEASON_SUMMARIES,
  TITLES,
} from "./player.fixtures";

const header = <PlayerHeader name="Kestrel" tagLine="EUNE" iconId={1295} />;

const meta = {
  title: "Player/Profile layout",
  component: PlayerProfileLayout,
  argTypes: {
    ...slots("header", "overview", "sidebar", "matches"),
  },
  parameters: { layout: "fullscreen" },
  // The page puts it in a PageShell, which spaces its parts.
  decorators: [
    (Story) => (
      <PageShell>
        <Story />
      </PageShell>
    ),
  ],
  args: {
    header,
    overview: (
      <PlayerSeasonOverview
        label="Season 2"
        titles={<PlayerTitles titles={TITLES} />}
        stats={
          <PlayerStats
            stats={STANDINGS[0]!}
            qualificationMatches={QUALIFICATION_MATCHES}
          />
        }
        chart={<RatingHistoryChart points={RATING_POINTS} />}
      />
    ),
    sidebar: (
      <>
        <PlayerSeasonSummaries summaries={SEASON_SUMMARIES} />
        <MostPlayedChampions champions={CHAMPIONS} />
        <PlayerRelations relations={RELATIONS} />
      </>
    ),
    matches: (
      <MatchList
        matches={[MATCH_CARD, { ...MATCH_CARD, id: MATCH_CARD.id + 1 }]}
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={fn()}
      />
    ),
  },
} satisfies Meta<typeof PlayerProfileLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A profile on a season the player played: overview, then the sidebar beside the matches. */
export const Season: Story = {};

/** A season the player sat out: why there is nothing, the summaries, and no match list. */
export const SatOut: Story = {
  args: {
    overview: (
      <PlayerSeasonEmpty seasonNumber={3} allSeasonsHref="?season=all" />
    ),
    sidebar: <PlayerSeasonSummaries summaries={SEASON_SUMMARIES} />,
    matches: null,
  },
};
