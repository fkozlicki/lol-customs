import type { Messages } from "./messages";
import type { routing } from "./routing";

/** Types every `useTranslations` and `getTranslations` key in the app against its dictionary. */
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}
