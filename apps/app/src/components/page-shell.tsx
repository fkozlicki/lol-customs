import { cn } from "@v1/ui/cn";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * The page container, in one place.
 *
 * DESIGN.md already writes this shell out as a string — `mx-auto w-full max-w-6xl space-y-10 px-4
 * pt-10 pb-16 sm:pt-16` — and it was copied into seventeen files, where the measure and the vertical
 * rhythm drifted apart. The padding is the same everywhere, so only the measure is a variant.
 */
const pageShell = cva("mx-auto w-full px-4 pt-10 pb-16 sm:pt-16", {
  variants: {
    /** How wide the measure is, in DESIGN.md's terms. */
    width: {
      /** Standings, matches, Hall of Fame, a profile. */
      wide: "max-w-6xl",
      /** The forum list, where lines of prose have to stay readable. */
      list: "max-w-4xl",
      /** A single post. */
      reading: "max-w-3xl",
    },
    /** Whether the shell separates its children, or the page does its own spacing. */
    gap: {
      sections: "space-y-10",
      none: "",
    },
  },
  defaultVariants: { width: "wide", gap: "sections" },
});

interface PageShellProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof pageShell> {}

export function PageShell({ width, gap, className, ...props }: PageShellProps) {
  return (
    <div className={cn(pageShell({ width, gap }), className)} {...props} />
  );
}
