"use client";

import { useTranslations } from "next-intl";
import type { HallOfFameView } from "./hall-of-fame-view";
import { HofSection } from "./hof-section";
import { TitleCollectors } from "./title-collectors";

/** Every title on the track, by section, after who collects the most of them. */
export function HallOfFame({ hallOfFame }: { hallOfFame: HallOfFameView }) {
  const t = useTranslations("hallOfFame");
  const { sections } = hallOfFame;

  return (
    <div className="space-y-16">
      <div className="space-y-8">
        <TitleCollectors
          mostBest={hallOfFame.mostBest}
          mostWorst={hallOfFame.mostWorst}
        />
        <nav
          aria-label={t("jumpTo")}
          className="flex flex-wrap gap-x-5 gap-y-2 md:hidden"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#hof-${section.id}`}
              className="label-caps underline-offset-4 hover:text-foreground hover:underline"
            >
              {section.name}
            </a>
          ))}
        </nav>
      </div>

      {sections.map((section) => (
        <HofSection key={section.id} section={section} />
      ))}
    </div>
  );
}
