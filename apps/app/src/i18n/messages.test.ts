import { describe, expect, test } from "bun:test";
import { messages as recipes } from "@v1/ui/recipes/messages";
import { createTranslator } from "next-intl";
import en from "@/locales/en";
import pl from "@/locales/pl";
import { compose, MESSAGES } from "./messages";

const app = { en, pl };

describe("the composed dictionary", () => {
  for (const locale of ["en", "pl"] as const) {
    test(`shares no top-level key between the recipes and the app (${locale})`, () => {
      const shared = Object.keys(recipes[locale]).filter(
        (key) => key in app[locale],
      );
      expect(shared).toEqual([]);
    });
  }

  test("serves the recipes' namespaces and the app's side by side", () => {
    const match = createTranslator({
      locale: "pl",
      messages: MESSAGES.pl,
      namespace: "match",
    });
    const player = createTranslator({
      locale: "pl",
      messages: MESSAGES.pl,
      namespace: "dashboard.pages.player",
    });

    expect(match("victory")).toBe("Wygrana");
    expect(player("rating")).toBe(pl.dashboard.pages.player.rating);
  });

  test("types a key neither side has as an error", () => {
    const match = createTranslator({
      locale: "en",
      messages: MESSAGES.en,
      namespace: "match",
      onError: () => {},
    });
    // @ts-expect-error — `nope` is in neither dictionary; the typed keys are what catch a typo.
    expect(match("nope")).toBe("match.nope");
  });

  test("rejects a top-level key both sides define, at compile time", () => {
    // @ts-expect-error — both sides define `match`, and the spread would drop the recipes' one.
    const clash = compose({ match: { a: "A" } }, { match: { b: "B" } });
    expect(Object.keys(clash)).toEqual(["match"]);
  });
});
