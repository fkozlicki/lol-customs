export default {
  welcome: "Cześć {name}!",
  locale: {
    en: "Angielski",
    pl: "Polski",
  },
  dashboard: {
    sidebar: {
      appName: "Derby",
      leaderboard: "Ranking",
      matchHistory: "Historia meczów",
      hallOfFame: "Sławy",
      duos: "Ekipa",
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
      duos: {
        title: "Ekipa",
        description:
          "Twoi stałacy i rywale: z kim grasz, wygrywasz lub przegrywasz oraz kogo zabijasz lub kto ciebie.",
        mostGamesWith: "Partner w zbrodni",
        mostWinsWith: "Talizman",
        mostLossesWith: "Kumpel do tiltu",
        mostKilledPlayer: "Twój worek treningowy",
        mostlyKilledBy: "Twój nemezis",
        noDataYet: "Brak danych.",
        showMore: "Więcej",
        showLess: "Mniej",
      },
      hallOfFame: {
        title: "Sala sław",
        description: "Najlepsi (i najgorsi) z laddera.",
        cards: {
          most_kills: {
            title: "Rzeźnik",
            description: "Najwięcej zabójstw na mecz.",
          },
          most_assists: {
            title: "Asystent roku",
            description: "Najwięcej asyst na mecz.",
          },
          best_farm: { title: "Rolnik", description: "Najwyższe CS na mecz." },
          cannon_fodder: {
            title: "Mięso armatnie",
            description: "Najwięcej zgonów na mecz.",
          },
          mvp: { title: "MVP", description: "Najwięcej gier jako MVP." },
          penta_hunter: {
            title: "Łowca pent",
            description: "Najwięcej pentakillów w historii.",
          },
          vision_master: {
            title: "Mistrz wizji",
            description: "Najwyższy vision score na mecz.",
          },
          damage_dealer: {
            title: "Dealer obrażeń",
            description: "Najwięcej obrażeń do championów na mecz.",
          },
          gold_hoarder: {
            title: "Skarbnik",
            description: "Najwięcej złota na mecz.",
          },
          ace: {
            title: "As",
            description: "Najwięcej Ace'ów (nosił team na plecach).",
          },
          quadra_killer: {
            title: "Quadra killer",
            description: "Najwięcej quadrakillów.",
          },
          triple_threat: {
            title: "Triple threat",
            description: "Najwięcej triple killi.",
          },
          tank: {
            title: "Czołg",
            description: "Najwięcej oberwanych obrażeń na mecz.",
          },
          life_saver: {
            title: "Ratownik",
            description: "Najwięcej healowania na mecz.",
          },
          cc_king: {
            title: "Król CC",
            description: "Najwięcej czasu w CC na mecz.",
          },
          tower_crusher: {
            title: "Niszczyciel wież",
            description: "Najwięcej wież na mecz.",
          },
          jungle_clearer: {
            title: "Czyszczacz dżungli",
            description: "Najwięcej jungle CS na mecz.",
          },
          op_score: {
            title: "OP Score",
            description: "Najwyższy OP score na mecz.",
          },
          big_spender: {
            title: "Wielki wydawca",
            description: "Najwięcej wydanego złota na mecz.",
          },
          level_lead: {
            title: "Przodownik leveli",
            description: "Najwyższy średni level.",
          },
          tilted: {
            title: "Wypalony",
            description: "Najdłuższa seria porażek.",
          },
          feeder: { title: "Feeder", description: "Najniższe KDA." },
          pacifist: {
            title: "Pacyfista",
            description: "Najmniej zabójstw na mecz.",
          },
          lone_wolf: {
            title: "Samotny wilk",
            description: "Najmniej asyst na mecz.",
          },
          blind: {
            title: "Ślepy",
            description: "Najniższy vision score na mecz.",
          },
          tower_hugger: {
            title: "Przytulacz wież",
            description: "Rzadko bierze wieże.",
          },
          behind: { title: "W tyle", description: "Stale niedolevelowany." },
          broke: { title: "Goły", description: "Najmniej złota na mecz." },
          no_heals: {
            title: "Bez healów",
            description: "Minimalne healowanie na mecz.",
          },
          bottom_of_ladder: {
            title: "Dno laddera",
            description: "Najniższy rating.",
          },
          cold: {
            title: "Zimny",
            description: "Nigdy nie miał serii wygranych.",
          },
          veteran_of_defeat: {
            title: "Weteran porażek",
            description: "Najwięcej porażek w sumie.",
          },
          worst_win_rate: {
            title: "Najgorszy WR",
            description: "Najniższy win rate (10+ gier).",
          },
          never_mvp: {
            title: "Nigdy MVP",
            description: "Najwięcej gier bez bycia MVP.",
          },
          never_ace: {
            title: "Nigdy Ace",
            description: "Najwięcej gier bez Ace'a.",
          },
          peashooter: {
            title: "Pukawka",
            description: "Najmniej obrażeń do championów na mecz.",
          },
          hoarder: {
            title: "Sknera",
            description: "Najmniej wydanego złota na mecz.",
          },
        },
      },
    },
  },
} as const;
