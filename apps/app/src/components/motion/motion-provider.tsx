"use client";

import { EASE } from "@v1/ui/recipes/motion";
import { MotionConfig } from "motion/react";

/**
 * Honours `prefers-reduced-motion`: transforms are skipped, opacity fades remain.
 * Local transitions must set `inherit: true` to keep the shared easing.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE }}>
      {children}
    </MotionConfig>
  );
}
