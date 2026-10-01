import type { TitleView } from "./hall-of-fame-view";
import { TitleCell } from "./title-cell";

/** Best and worst title on the same stat, one row each; a pair stays together on phones. */
export function TitlePairs({ pairs }: { pairs: [TitleView, TitleView][] }) {
  return (
    <div className="divide-y">
      {pairs.map(([best, worst]) => (
        <div key={best.id} className="grid md:grid-cols-2 md:gap-24">
          <TitleCell title={best} className="pb-2 md:pb-4" />
          <TitleCell title={worst} className="md:justify-self-end" />
        </div>
      ))}
    </div>
  );
}
