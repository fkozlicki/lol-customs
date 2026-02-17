export default {
  welcome: "Hello {name}!",
  dashboard: {
    sidebar: {
      appName: "Niunio",
      leaderboard: "Leaderboard",
      matchHistory: "Match history",
      downloadDesktopApp: "Download desktop app",
    },
    download: {
      title: "Download Niunio",
      description: "Choose the format you prefer.",
      installerExe: "Installer (.exe)",
      zipPortable: "ZIP (portable)",
    },
    theme: {
      toggleLabel: "Toggle theme",
      system: "System",
      light: "Light",
      dark: "Dark",
      tooltip: "Theme: {label}",
    },
    pages: {
      leaderboard: {
        title: "Leaderboard",
        description: "Player ratings and standings.",
        emptyTitle: "Leaderboard",
        noPlayersYet: "No players yet.",
        tablePlayer: "Player",
        tableRating: "Rating",
        tableWl: "W/L",
        tableWr: "WR",
        tableStreak: "Streak",
        tableBest: "Best",
        rank1st: "1st",
        rank2nd: "2nd",
        rank3rd: "3rd",
      },
      matchHistory: {
        title: "Match history",
        description: "Recent custom games.",
        emptyTitle: "Match history",
        noMatchesYet: "No matches yet.",
      },
    },
  },
} as const;
