"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { DURATION } from "../motion";

/** The home page's title: which standings these are, at the size of the page. */
export function StandingsHero({ seasonTitle }: { seasonTitle: string }) {
  const t = useTranslations("standings");

  return (
    <div className="space-y-3">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ inherit: true, duration: DURATION.base }}
        className="label-caps"
      >
        {t("title")}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ inherit: true, duration: DURATION.slow }}
        className="text-[clamp(3.25rem,13vw,9rem)] font-semibold uppercase leading-[0.85] tracking-[-0.045em]"
      >
        {seasonTitle}
      </motion.h1>
    </div>
  );
}
