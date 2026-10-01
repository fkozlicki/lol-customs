import type { RecipeMessages } from "@v1/ui/recipes/messages";

/** Types `useTranslations` keys in stories and recipes against the recipes' messages, all this serves. */
declare module "next-intl" {
  interface AppConfig {
    Messages: RecipeMessages;
  }
}
