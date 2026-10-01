import { messages } from "@v1/ui/recipes/messages";

type Locale = keyof typeof messages;

/**
 * The recipes' messages in the locale a story renders in. A `play` function finds buttons and fields
 * by the words a reader sees, so it works in every locale the tests run in — and checks the words too.
 */
export function wordsFor(globals: Record<string, unknown>) {
  const locale = globals.locale as Locale | undefined;
  return messages[locale && locale in messages ? locale : "en"];
}
