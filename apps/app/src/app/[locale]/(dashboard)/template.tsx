"use client";

import { DURATION } from "@v1/ui/recipes/motion";
import { motion } from "motion/react";

/** Pages cross-fade briefly on navigation; nothing slides. */
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ inherit: true, duration: DURATION.fast }}
    >
      {children}
    </motion.div>
  );
}
