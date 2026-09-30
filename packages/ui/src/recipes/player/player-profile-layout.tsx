"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { SectionHeading } from "../page-header";

interface PlayerProfileLayoutProps {
  header: ReactNode;
  /** The season's overview, or why there is none. */
  overview: ReactNode;
  /** Season summaries, then the champions and relations when the season has games. */
  sidebar: ReactNode;
  /** The season's matches; null when the player has none in it. */
  matches: ReactNode | null;
}

/** A player's profile: the header, the season overview, then the sidebar beside the matches. */
export function PlayerProfileLayout({
  header,
  overview,
  sidebar,
  matches,
}: PlayerProfileLayoutProps) {
  const t = useTranslations("player");

  return (
    <>
      {header}
      {overview}
      <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-10">{sidebar}</aside>
        {matches && (
          <section>
            <SectionHeading>{t("matches")}</SectionHeading>
            {matches}
          </section>
        )}
      </div>
    </>
  );
}
