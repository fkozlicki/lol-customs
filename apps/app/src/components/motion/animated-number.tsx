"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DURATION, EASE } from "@/utils/motion";

interface AnimatedNumberProps {
  value: number;
  /** Where the count starts on first render, on the server and the client alike. */
  from?: number;
  delay?: number;
  className?: string;
}

/**
 * Counts up to `value` once it enters, and to every later value it changes to.
 *
 * The first render is always `from`. The server cannot know `prefers-reduced-motion`, so choosing
 * the starting number from it rendered `from` on the server and `value` on a reduced-motion client —
 * a hydration mismatch that made React throw the podium away and rebuild it. Reduced motion is
 * honoured after mount instead, by jumping straight to `value`.
 *
 * The number is React state rather than a motion value rendered as a child: that child only updates
 * on a change event, and a remount (StrictMode does one in development) re-subscribes without
 * re-reading, so a value set once before it could stay on screen as `from`.
 */
export function AnimatedNumber({
  value,
  from = 0,
  delay = 0,
  className,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(from);
  // Where the count currently is, so a new value animates on from there rather than from `from`.
  const current = useRef(from);

  useEffect(() => {
    if (reduceMotion) {
      current.current = value;
      setShown(value);
      return;
    }
    const controls = animate(current.current, value, {
      duration: DURATION.count,
      ease: EASE,
      delay,
      onUpdate: (latest) => {
        current.current = latest;
        setShown(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [value, delay, reduceMotion]);

  return <span className={className}>{shown}</span>;
}
