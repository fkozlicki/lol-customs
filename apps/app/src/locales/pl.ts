export default {
  locale: {
    en: "Angielski",
    pl: "Polski",
  },
  dashboard: {
    retry: "Spróbuj ponownie",
    auth: {
      profile: {
        nickname: {
          tooShort: "Nick musi mieć co najmniej 2 znaki.",
          tooLong: "Nick może mieć najwyżej 30 znaków.",
          invalid: "Tylko litery, cyfry, spacje, podkreślniki i myślniki.",
        },
        toast: {
          success: "Witaj! Twój profil został utworzony.",
          avatarTooLarge: "Awatar musi być mniejszy niż 5 MB",
          signInFailed: "Logowanie nie powiodło się. Spróbuj ponownie.",
          getUserFailed: "Nie udało się pobrać użytkownika. Spróbuj ponownie.",
          avatarUploadFailed:
            "Przesyłanie awatara nie powiodło się. Możesz ustawić go później.",
        },
      },
    },
    sidebar: {
      leaderboard: "Ranking",
      matchHistory: "Mecze",
      hallOfFame: "Sławy",
      shuffle: "Losuj",
      auctions: "Aukcje",
      posts: "Forum",
    },
    season: {
      label: "Sezon {number}",
      allTime: "Wszystkie sezony",
    },
    pages: {
      matchHistory: {
        title: "Mecze",
        description: "Wszystkie mecze ladderu, od najnowszych.",
      },
      shuffle: {
        title: "Losuj",
        description:
          "Wybierz dziesięciu graczy i losuj drużyny. Strony, role i kapitanowie są losowe.",
        toastDuplicate: "Ten gracz jest już na liście.",
        toastInvalidRiot: "Użyj formatu Nick#TAG (np. Hide on bush#EUW).",
        clearRoster: "Wyczyść",
        generate: "Losuj drużyny",
        reroll: "Losuj ponownie",
        picker: {
          title: "Skład",
          hint: "Dodaj dziesięciu graczy z listy obok albo po Riot ID.",
          empty: "Dodaj dziesięciu graczy z listy obok albo po Riot ID.",
          remove: "Usuń",
          fromLadder: "Z rankingu",
          search: "Szukaj po nicku w grze…",
          noResults: "Brak graczy pasujących do wyszukiwania.",
          add: "Dodaj",
          riotIdLabel: "Riot ID",
          riotIdPlaceholder: "Nick#TAG",
        },
      },
      auctions: {
        title: "Aukcje live",
        description:
          "Ułóż dwa pięcioosobowe składy w publicznym pokoju z czasem kontrolowanym przez serwer.",
        create: "Utwórz aukcję",
        cancel: "Anuluj aukcję",
        creator: {
          eyebrow: "Dom aukcyjny",
          title: "Utwórz aukcję live",
          description:
            "Wybierz ośmiu graczy, których kupią kapitanowie. Ty jesteś kapitanem Team A; drugi kapitan dołącza z linku do pokoju.",
          duplicate: "To Riot ID jest już w puli.",
          invalidRiotId: "Użyj formatu Nick#TAG.",
          updated: "Lobby zaktualizowane.",
          clear: "Wyczyść",
          cancel: "Anuluj",
          create: "Utwórz pokój",
          save: "Zapisz lobby",
          saving: "Zapisywanie...",
        },
        picker: {
          title: "Pula graczy",
          hint: "Dodaj ośmiu graczy z rankingu lub przez Riot ID.",
          empty: "Brak dostępnych graczy.",
          remove: "Usuń gracza",
          fromLadder: "Z rankingu",
          search: "Szukaj graczy w rankingu...",
          noResults: "Brak dostępnych graczy.",
          add: "Dodaj",
          riotIdLabel: "Dodaj Riot ID",
          riotIdPlaceholder: "Nick#TAG",
        },
        room: {
          teamB: "Team B",
          versus: "vs",
        },
        lobby: {
          starting: "Aukcja startuje za",
          ready: "Jestem gotowy",
          unready: "Wycofaj gotowość",
          linkCopied: "Link do pokoju skopiowany.",
          linkCopyFailed: "Nie udało się skopiować linku do pokoju.",
        },
      },
      posts: {
        title: "Forum",
        newPost: "Nowy post",
        description: "Rozmowy grupy: mecze, aukcje i plany na sezon.",
        reactionFailed: "Nie udało się zapisać reakcji.",
        like: "Polub",
        dislike: "Nie podoba mi się",
        newPostPage: {
          contentPlaceholder: "Napisz swój post...",
          titleRequired: "Nadaj postowi tytuł.",
          toast: {
            created: "Post opublikowany!",
          },
        },
        imageUpload: {
          tooLarge: "Obraz musi mieć mniej niż 10 MB.",
          failed: "Nie udało się wgrać obrazu.",
        },
        comments: {
          placeholder: "Napisz komentarz...",
        },
      },
      hallOfFame: {
        title: "Sala sław",
        description: "Kto trzyma najlepsze i najgorsze rekordy laddera.",
        sections: {
          headline: "Ranking",
          form: "Forma",
          fighting: "Walka",
          multikills: "Multikille",
          farm: "Farma i złoto",
          map: "Mapa",
        },
        stats: {
          mvpMatches: "mecze jako MVP",
          matchesWithoutMvp: "mecze bez MVP",
          aceMatches: "mecze jako ACE",
          matchesWithoutAce: "mecze bez ACE",
          opScore: "OP score / mecz",
          winRate: "win rate",
          winStreak: "wygrane z rzędu",
          loseStreak: "porażki z rzędu",
          kills: "zabójstwa / mecz",
          assists: "asysty / mecz",
          damage: "obrażenia / mecz",
          deaths: "zgony / mecz",
          ccTime: "sekundy CC / mecz",
          kda: "KDA",
          doublekills: "double kille",
          pentakills: "pentakille",
          quadrakills: "quadrakille",
          triplekills: "triple kille",
          cs: "CS / mecz",
          jungleCs: "jungle CS jako jungler",
          gold: "złoto / mecz",
          level: "level na koniec",
          vision: "wizja / mecz",
          healing: "leczenie / mecz",
          turrets: "wieże / mecz",
        },
        cards: {
          double_trouble: {
            title: "Dublet",
            description: "Najwięcej double killi",
          },
          fewest_deaths: {
            title: "Nieśmiertelny",
            description: "Najmniej zgonów na mecz",
          },
          best_kda: {
            title: "Bez skazy",
            description: "Najwyższe KDA",
          },
          no_cc: {
            title: "Głaskacz",
            description: "Najmniej CC na mecz",
          },
          worst_farm: {
            title: "Wegetarianin",
            description: "Najniższe CS na mecz",
          },
          jungle_tourist: {
            title: "Turysta w dżungli",
            description: "Najmniej jungle CS na mecz jako jungler",
          },
          mvp: {
            title: "MVP",
            description: "Mecze jako MVP",
          },
          never_mvp: {
            title: "Nigdy MVP",
            description: "Mecze bez MVP",
          },
          ace: {
            title: "ACE",
            description: "Mecze jako ACE",
          },
          never_ace: {
            title: "Nigdy ACE",
            description: "Mecze bez ACE",
          },
          op_score: {
            title: "Carry",
            description: "Średni OP score",
          },
          worst_op_score: {
            title: "Balast",
            description: "Najniższy średni OP score",
          },
          best_win_rate: {
            title: "Zwycięzca",
            description: "Najwyższy win rate",
          },
          worst_win_rate: {
            title: "Przegryw",
            description: "Najniższy win rate",
          },
          best_streak: {
            title: "W gazie",
            description: "Najdłuższa seria wygranych",
          },
          tilted: {
            title: "Na tilcie",
            description: "Najdłuższa seria porażek",
          },
          most_kills: {
            title: "Rzeźnik",
            description: "Zabójstwa na mecz",
          },
          pacifist: {
            title: "Pacyfista",
            description: "Najmniej zabójstw na mecz",
          },
          most_assists: {
            title: "Asystent roku",
            description: "Asysty na mecz",
          },
          lone_wolf: {
            title: "Samotny wilk",
            description: "Najmniej asyst na mecz",
          },
          damage_dealer: {
            title: "Armata",
            description: "Obrażenia do championów na mecz",
          },
          peashooter: {
            title: "Pukawka",
            description: "Najmniej obrażeń do championów na mecz",
          },
          cannon_fodder: {
            title: "Mięso armatnie",
            description: "Zgony na mecz",
          },
          cc_king: {
            title: "Król CC",
            description: "Czas CC na mecz",
          },
          feeder: {
            title: "Feeder",
            description: "Najniższe KDA",
          },
          penta_hunter: {
            title: "Łowca pent",
            description: "Pentakille",
          },
          quadra_killer: {
            title: "Kareta",
            description: "Najwięcej quadrakilli",
          },
          triple_threat: {
            title: "Hat-trick",
            description: "Najwięcej triple killi",
          },
          best_farm: {
            title: "Rolnik",
            description: "CS na mecz",
          },
          jungle_clearer: {
            title: "Drwal",
            description: "Jungle CS na mecz jako jungler",
          },
          gold_hoarder: {
            title: "Midas",
            description: "Zdobyte złoto na mecz",
          },
          broke: {
            title: "Bankrut",
            description: "Najmniej złota na mecz",
          },
          level_lead: {
            title: "Wymaksowany",
            description: "Level na koniec meczu",
          },
          behind: {
            title: "Żółtodziób",
            description: "Najniższy level na koniec meczu",
          },
          vision_master: {
            title: "Sokole oko",
            description: "Vision score na mecz",
          },
          blind: {
            title: "Kret",
            description: "Najniższy vision score na mecz",
          },
          life_saver: {
            title: "Ratownik",
            description: "Leczenie na mecz",
          },
          no_heals: {
            title: "Znachor",
            description: "Najmniej leczenia na mecz",
          },
          tower_crusher: {
            title: "Burzyciel",
            description: "Wieże na mecz",
          },
          tower_hugger: {
            title: "Konserwator zabytków",
            description: "Najmniej wież na mecz",
          },
        },
      },
    },
  },
} as const;
