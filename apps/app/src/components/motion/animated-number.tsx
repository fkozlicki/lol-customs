"use client";

import { animate, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { DURATION, EASE } from "@/utils/motion";

interface AnimatedNumberProps {
  value: number;
  /** Where the count starts on first render, on the server and the client alike. */
  from?: number;
  delay?: number;
  className?: string;
}

/**
 * Counts up to `value` once it enters, and to every later value it changes to. With reduced
 * motion it shows `value` straight away.
 *
 * The first render is always `from`: the server cannot know `prefers-reduced-motion`, so anything
 * rendered from it would differ between server and client. The preference is applied in a layout
 * effect instead, which runs before the browser paints, so a reduced-motion reader never sees
 * `from`.
 *
 * The number is React state, not a motion value rendered as a child. Such a child only updates on a
 * change event, and a remount (StrictMode does one in development) re-subscribes without
 * re-reading, which can leave `from` on screen.
 */
export function AnimatedNumber({
  value,
  from = 0,
  delay = 0,
  className,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(from);
  // Where the count is now, unrounded, so a new value counts on from here rather than from `from`.
  const position = useRef(from);

  useLayoutEffect(() => {
    if (reduceMotion) {
      position.current = value;
      setShown(Math.round(value));
      return;
    }
    const controls = animate(position.current, value, {
      duration: DURATION.count,
      ease: EASE,
      delay,
      onUpdate: (latest) => {
        position.current = latest;
        setShown(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [value, delay, reduceMotion]);

  return <span className={className}>{shown}</span>;
}
