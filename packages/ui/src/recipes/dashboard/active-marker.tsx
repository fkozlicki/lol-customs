"use client";

import { motion } from "motion/react";
import { DURATION } from "../motion";

/** The rule under the current top-bar item; one shared layout id, so it slides between items. */
export function ActiveMarker() {
  return (
    <motion.span
      layoutId="top-bar-active"
      transition={{ inherit: true, duration: DURATION.base }}
      className="absolute inset-x-0 -bottom-px h-0.5 bg-foreground"
    />
  );
}
