import { cn } from "@v1/ui/cn";
import { cva, type VariantProps } from "class-variance-authority";
import { RankCrest } from "@/components/game-assets/rank-crest";

/**
 * A Solo/Duo rank crest with its label beside it.
 *
 * Built four times across matches, profiles and the shuffle, with three crest sizes and two gaps that
 * did not line up. The label is the caller's — sometimes it is the rank, sometimes the rank with a
 * prefix ("Avg solo") or a suffix (LP) — so the component owns the crest, the alignment and the type,
 * and nothing else.
 *
 * `label-caps` is not optional here: a rank beside a name is metadata, and DESIGN.md rule 6 puts
 * metadata in uppercase mono.
 */
const rankTag = cva("flex shrink-0 items-center", {
  variants: {
    size: {
      /** Inline with a player's name in a match row. */
      sm: "gap-1",
      /** The default: a profile line, a roster entry. */
      md: "gap-1.5",
      /** Beside a team heading, where the crest carries more weight. */
      lg: "gap-1.5",
    },
  },
  defaultVariants: { size: "md" },
});

/** next/image wants numbers, so the crest sizes live beside the gaps rather than in the recipe. */
const CREST_SIZE = { sm: 14, md: 16, lg: 18 } as const;

interface RankTagProps extends VariantProps<typeof rankTag> {
  tier: string | null;
  children: React.ReactNode;
  className?: string;
}

export function RankTag({
  tier,
  size = "md",
  className,
  children,
}: RankTagProps) {
  const crest = CREST_SIZE[size ?? "md"];

  return (
    <span className={cn(rankTag({ size }), className)}>
      <RankCrest
        tier={tier}
        width={crest}
        height={crest}
        className="shrink-0"
      />
      <span className="label-caps">{children}</span>
    </span>
  );
}
