"use client";

import { MotionConfig } from "motion/react";
import { EASE } from "@/utils/motion";

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
