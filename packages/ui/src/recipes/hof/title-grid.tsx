import type { TitleView } from "./hall-of-fame-view";
import { TitleCell } from "./title-cell";

/** A section of unpaired titles only: side by side on wider screens, since nothing here reads as a pair. */
export function TitleGrid({ titles }: { titles: TitleView[] }) {
  return (
    <div className="grid divide-y sm:grid-cols-2 sm:gap-x-12 sm:divide-y-0 lg:grid-cols-4">
      {titles.map((title) => (
        <TitleCell key={title.id} title={title} className="md:max-w-none" />
      ))}
    </div>
  );
}
