import type { RecipeMessages } from ".";

/**
 * Types the recipes' `useTranslations` keys when this package is checked on its own. Nothing imports
 * this file, so it never meets the app's declaration of the composed dictionary in one program, where
 * two `Messages` types would collide (ADR 0005).
 */
declare module "next-intl" {
  interface AppConfig {
    Messages: RecipeMessages;
  }
}
