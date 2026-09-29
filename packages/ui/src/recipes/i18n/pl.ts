import type en from "./en";
import type { Strings } from "./format";

/** The same keys as `en.ts`; a key missing or extra here fails typecheck. */
export default {
  match: {
    kills: "Zabójstwa",
    gold: "Złoto",
  },
  season: {
    emptyPlayerTitle: "Brak gier w Sezonie {number}",
    emptyPlayerDescription: "Ten gracz nie zagrał jeszcze w tym sezonie.",
    showAllTime: "Pokaż wszystkie sezony",
  },
  forum: {
    sensitiveContent: {
      title: "Wrażliwa treść",
      description: "Ten obraz może zawierać treści dla dorosłych.",
      show: "Pokaż obraz",
    },
  },
} satisfies Strings<typeof en>;
