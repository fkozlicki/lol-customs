/** One easing curve for the whole app; mirrors `--ease-derby` in styles.css. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Durations in seconds. State changes stay within 150–400 ms; only number count-ups run longer. */
export const DURATION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  count: 0.8,
} as const;

/** Delay between siblings entering one after another. */
export const STAGGER = 0.04;
