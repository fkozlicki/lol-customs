export default {
  welcome: "Cześć {name}!",
  dashboard: {
    sidebar: {
      appName: "Niunio",
      leaderboard: "Ranking",
      matchHistory: "Historia meczów",
      downloadDesktopApp: "Pobierz aplikację desktop",
    },
    download: {
      title: "Pobierz Niunio",
      description: "Wybierz preferowany format.",
      installerExe: "Instalator (.exe)",
      zipPortable: "ZIP (przenośna)",
    },
    theme: {
      toggleLabel: "Przełącz motyw",
      system: "System",
      light: "Jasny",
      dark: "Ciemny",
      tooltip: "Motyw: {label}",
    },
    pages: {
      leaderboard: {
        title: "Ranking",
        description: "Oceny i pozycje graczy.",
        emptyTitle: "Ranking",
        noPlayersYet: "Brak graczy.",
        tablePlayer: "Gracz",
        tableRating: "Punkty",
        tableWl: "W/P",
        tableWr: "WR",
        tableKda: "KDA",
        tableStreak: "Seria",
        tableBest: "Rekord",
        rank1st: "1.",
        rank2nd: "2.",
        rank3rd: "3.",
      },
      matchHistory: {
        title: "Historia meczów",
        description: "Ostatnie mecze custom.",
        emptyTitle: "Historia meczów",
        noMatchesYet: "Brak meczów.",
      },
    },
  },
} as const;
