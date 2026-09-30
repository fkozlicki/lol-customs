/**
 * Every string a recipe renders, in English. Keyed by what it names, not by the page it first appeared
 * on: `match.mvp`, once, rather than an `mvp` under every page that shows one.
 *
 * A string belongs here when a recipe renders it; the app's own live in `apps/app/src/locales`. The two
 * are spread into one dictionary, so a top-level key here cannot share a name with one of the app's.
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
  auctions: {
    connection: {
      connecting: "Connecting",
      live: "Live sync",
      degraded: "Polling",
    },
  },
  season: {
    emptyPlayerTitle: "No games in Season {number}",
    emptyPlayerDescription: "This player has not played in this season yet.",
    showAllTime: "Show all seasons",
    label: "Season {number}",
    summariesTitle: "Seasons",
    summaryRecord: "{wins}W / {losses}L",
  },
  forum: {
    unknownAuthor: "Unknown",
    sensitiveContent: {
      title: "Sensitive content",
      description: "This image may contain adult content.",
      show: "Show image",
    },
  },
  player: {
    position: "Position",
    rating: "Rating",
    record: "Record",
    kda: "KDA",
    mvp: "MVP",
    ace: "ACE",
    streak: "Streak",
    best: "Best {count}",
    qualifying: "Qualifying",
    qualifyingProgress: "{matches} of {count} matches",
    ratingHistory: "Rating history",
    noRatingHistory: "No rating history yet.",
    mostPlayed: "Most played",
    noChampionData: "No champions yet.",
    matchesLabel: "matches",
    unranked: "Unranked",
    soloDuo: "Solo/Duo",
    teammates: "Teammates",
    rivals: "Rivals",
    mostMatchesWith: "Partner in crime",
    mostWinsWith: "Lucky charm",
    mostLossesWith: "Tilt buddy",
    bestRecord: "Favourite opponent",
    worstRecord: "Kryptonite",
    mostKilled: "Punching bag",
    mostKilledBy: "Nemesis",
    matchesTogether: "{count} together",
    killsCount: "{count} kills",
    noRelation: "Not enough matches yet",
    noKillData: "No kills recorded",
  },
} as const;
