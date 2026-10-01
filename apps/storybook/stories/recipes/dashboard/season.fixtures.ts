import type { SeasonOptionView } from "@v1/ui/recipes/dashboard/season-selector";

/** Two seasons, the second current. */
export const SEASONS: SeasonOptionView[] = [
  { value: "1", seasonNumber: 1, isCurrent: false },
  { value: "2", seasonNumber: 2, isCurrent: true },
];
