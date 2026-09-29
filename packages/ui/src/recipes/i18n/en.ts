/**
 * Every string a recipe renders, in English. Keyed by what it names, not by the page it first appeared
 * on: `match.mvp`, once, rather than an `mvp` under every page that shows one.
 *
 * The app's own strings live in `apps/app/src/locales`. A string belongs here when a recipe renders it.
 */
export default {
  match: {
    kills: "Kills",
    gold: "Gold",
  },
  season: {
    emptyPlayerTitle: "No games in Season {number}",
    emptyPlayerDescription: "This player has not played in this season yet.",
    showAllTime: "Show all seasons",
  },
  forum: {
    sensitiveContent: {
      title: "Sensitive content",
      description: "This image may contain adult content.",
      show: "Show image",
    },
  },
} as const;
