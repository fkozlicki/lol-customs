"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect } from "react";
import { DURATION, EASE } from "@/utils/motion";

interface AnimatedNumberProps {
  value: number;
  /** Where the count starts on first render. */
  from?: number;
  delay?: number;
  className?: string;
}

/** Counts up to `value` once it enters, and to every later value it changes to. */
export function AnimatedNumber({
  value,
  from = 0,
  delay = 0,
  className,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(reduceMotion ? value : from);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (reduceMotion) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, {
      duration: DURATION.count,
      ease: EASE,
      delay,
    });
    return () => controls.stop();
  }, [count, value, delay, reduceMotion]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
