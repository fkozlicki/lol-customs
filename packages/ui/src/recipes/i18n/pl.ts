import type en from "./en";
import type { Strings } from "./format";

/** The same keys as `en.ts`; a key missing or extra here fails typecheck. */
export default {
  match: {
    victory: "Wygrana",
    defeat: "Przegrana",
    winner: "Wygrywa",
    sideBlue: "Niebiescy",
    sideRed: "Czerwoni",
    mvp: "MVP",
    ace: "ACE",
    opScore: "OP score",
    kda: "KDA",
    perfect: "Perfect",
    killParticipation: "Udział",
    damage: "Obrażenia",
    wards: "Wardy",
    cs: "CS",
    items: "Przedmioty",
    kills: "Zabójstwa",
    gold: "Złoto",
    unranked: "Bez rangi",
    expand: "Pokaż szczegóły meczu",
  },
  standings: {
    best: "Rekord",
    podiumQualifying: "Kwalifikacje trwają",
    podiumQualifyingHint:
      "Podium zapełni się, gdy gracze rozegrają {count} meczów.",
    historyLabel: "Po meczu",
    historyLive: "Live",
  },
  nav: {
    more: "Więcej",
  },
  download: {
    button: "Pobierz Derby Sync",
    title: "Pobierz Derby Sync",
    description: "Wybierz preferowany format.",
    installerExe: "Instalator (.exe)",
    zipPortable: "ZIP (przenośna)",
  },
  auctions: {
    connection: {
      connecting: "Łączenie",
      live: "Synchronizacja live",
      degraded: "Odpytywanie",
    },
  },
  season: {
    emptyPlayerTitle: "Brak gier w Sezonie {number}",
    emptyPlayerDescription: "Ten gracz nie zagrał jeszcze w tym sezonie.",
    showAllTime: "Pokaż wszystkie sezony",
  },
  forum: {
    unknownAuthor: "Nieznany",
    sensitiveContent: {
      title: "Wrażliwa treść",
      description: "Ten obraz może zawierać treści dla dorosłych.",
      show: "Pokaż obraz",
    },
  },
} satisfies Strings<typeof en>;
