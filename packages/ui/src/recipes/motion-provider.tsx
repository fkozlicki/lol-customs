"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { EASE } from "./motion";

/**
 * Motion as every recipe expects it: the one easing curve, and `prefers-reduced-motion` honoured
 * (transforms are skipped, opacity fades remain). Local transitions set `inherit: true` to keep the
 * shared easing. The app's layout and Storybook's preview both wrap everything in it.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE }}>
      {children}
    </MotionConfig>
  );
}
