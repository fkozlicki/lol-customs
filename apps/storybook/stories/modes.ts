/**
 * Chromatic snapshots every story in both themes (the `dark` and `light` modes in preview.tsx), at
 * its own 1200 px. A story that opens on a viewport has to say so to Chromatic too: the mobile nav is
 * hidden at 1200 px, so its snapshot would be empty and its play function would fail. A story's modes
 * add to the inherited ones, so those two are switched off here rather than snapshotted at 1200 px.
 */
export function chromaticAt(viewport: "phone" | "desktop") {
  return {
    chromatic: {
      modes: {
        dark: { disable: true },
        light: { disable: true },
        [`dark ${viewport}`]: { theme: "dark", viewport },
        [`light ${viewport}`]: { theme: "light", viewport },
      },
    },
  };
}
