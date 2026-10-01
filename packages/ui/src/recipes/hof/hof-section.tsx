import type { HofSectionView } from "./hall-of-fame-view";
import { SectionTitle } from "./section-title";
import { SingleTitles } from "./single-titles";
import { TitleGrid } from "./title-grid";
import { TitlePairs } from "./title-pairs";

/** One section of the Hall of Fame, anchored so the section links on phones can jump to it. */
export function HofSection({ section }: { section: HofSectionView }) {
  return (
    <section id={`hof-${section.id}`} className="scroll-mt-20">
      <SectionTitle>{section.name}</SectionTitle>
      {section.pairs.length > 0 ? (
        <>
          <TitlePairs pairs={section.pairs} />
          <SingleTitles singles={section.singles} />
        </>
      ) : (
        <TitleGrid titles={section.singles} />
      )}
    </section>
  );
}
