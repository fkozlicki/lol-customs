import type { TitleView } from "./hall-of-fame-view";
import { TitleCell } from "./title-cell";

/** Unpaired titles, full width under a section's pairs. */
export function SingleTitles({ singles }: { singles: TitleView[] }) {
  if (singles.length === 0) return null;

  return (
    <div className="divide-y border-t">
      {singles.map((title) => (
        <TitleCell key={title.id} title={title} className="md:max-w-none" />
      ))}
    </div>
  );
}
