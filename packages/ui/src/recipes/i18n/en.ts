/**
 * Every string a recipe renders, in English. Keyed by what it names, not by the page it first appeared
 * on: `match.mvp`, once, rather than an `mvp` under every page that shows one.
 *
 * The app's own strings live in `apps/app/src/locales`. A string belongs here when a recipe renders it.
 */
export default {
  match: {
    victory: "Victory",
    defeat: "Defeat",
    winner: "Winner",
    sideBlue: "Blue",
    sideRed: "Red",
    mvp: "MVP",
    ace: "ACE",
    opScore: "OP score",
    kda: "KDA",
    perfect: "Perfect",
    killParticipation: "KP",
    damage: "Damage",
    wards: "Wards",
    cs: "CS",
    items: "Items",
    kills: "Kills",
    gold: "Gold",
    unranked: "Unranked",
    expand: "Show match details",
  },
  standings: {
    best: "Best",
    podiumQualifying: "Qualifying in progress",
    podiumQualifyingHint:
      "The podium fills up once players reach {count} matches.",
    historyLabel: "After match",
    historyLive: "Live",
  },
  nav: {
    more: "More",
  },
  download: {
    button: "Download Derby Sync",
    title: "Download Derby Sync",
    description: "Choose the format you prefer.",
    installerExe: "Installer (.exe)",
    zipPortable: "ZIP (portable)",
  },
  season: {
    emptyPlayerTitle: "No games in Season {number}",
    emptyPlayerDescription: "This player has not played in this season yet.",
    showAllTime: "Show all seasons",
  },
  forum: {
    unknownAuthor: "Unknown",
    sensitiveContent: {
      title: "Sensitive content",
      description: "This image may contain adult content.",
      show: "Show image",
    },
  },
} as const;
