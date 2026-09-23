/**
 * Riot's Solo/Duo **Rank** — a tier plus a division, shown as decoration.
 *
 * Not to be confused with a **Rating**, the ladder Elo that actually decides the standings.
 * A rank is mapped onto a number so ranks can be ordered and averaged.
 */

export const RANK_TIER_ORDER = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
] as const;

/** Worst first, so a higher index is a better division. */
export const RANK_DIVISION_ORDER = ["IV", "III", "II", "I"] as const;

/** Tiers above Diamond have no divisions. */
const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

const STEPS = RANK_TIER_ORDER.length * RANK_DIVISION_ORDER.length;

export function isApexTier(tier: string | null | undefined): boolean {
  return APEX_TIERS.has((tier ?? "").trim().toUpperCase());
}

/** Rank → position on a single scale, or null when the tier is missing or unknown. */
export function rankToNumeric(
  tier: string | null,
  division: string | null,
): number | null {
  if (!tier) return null;
  const tierUpper = tier.toUpperCase();
  const tierIdx = RANK_TIER_ORDER.indexOf(
    tierUpper as (typeof RANK_TIER_ORDER)[number],
  );
  if (tierIdx === -1) return null;
  if (isApexTier(tierUpper)) {
    return (
      tierIdx * RANK_DIVISION_ORDER.length + RANK_DIVISION_ORDER.length - 1
    );
  }
  const divUpper = (division ?? "IV").toUpperCase();
  const divIdx = RANK_DIVISION_ORDER.indexOf(
    divUpper as (typeof RANK_DIVISION_ORDER)[number],
  );
  return tierIdx * RANK_DIVISION_ORDER.length + (divIdx === -1 ? 0 : divIdx);
}

/**
 * Position on the scale → the nearest rank.
 *
 * Tier and division are derived from the same rounded value, so the division always belongs to the
 * tier being reported. Deriving them separately let a floored tier keep a wrapped division, which
 * reported the worst division of the tier below.
 */
export function numericToRank(n: number): { tier: string; division: string } {
  const rounded = Math.min(Math.max(Math.round(n), 0), STEPS - 1);
  const tierIdx = Math.floor(rounded / RANK_DIVISION_ORDER.length);
  const tier = RANK_TIER_ORDER[tierIdx] ?? "CHALLENGER";
  const division = isApexTier(tier)
    ? "I"
    : (RANK_DIVISION_ORDER[rounded % RANK_DIVISION_ORDER.length] ?? "IV");
  return { tier, division };
}

/** A rank as it is written: "GOLD II", or just "MASTER" where divisions do not exist. */
export function formatRank(
  tier: string | null,
  division: string | null,
): string | null {
  if (!tier?.trim()) return null;
  if (isApexTier(tier) || !division?.trim()) return tier;
  return `${tier} ${division}`;
}

/**
 * Average rank of a group, for display next to a drawn team.
 *
 * Players without a rank are left out rather than counted as the lowest, so one unranked player
 * does not drag the whole team down.
 */
export function averageSoloRankMeta(
  snapshots: { tier: string | null; division: string | null }[],
): { label: string; tier: string | null } {
  const values = snapshots
    .map((p) => rankToNumeric(p.tier, p.division))
    .filter((v): v is number => v != null);

  if (values.length === 0) {
    return { label: "—", tier: null };
  }

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const { tier, division } = numericToRank(avg);
  const label = isApexTier(tier)
    ? tier.toLowerCase()
    : `${tier.toLowerCase()} ${division}`;
  return { label, tier };
}

/** The same average, for rows that carry the database's column names. */
export function averageGameRank(
  participants: { rank_tier: string | null; rank_division: string | null }[],
): string {
  return averageSoloRankMeta(
    participants.map((p) => ({
      tier: p.rank_tier,
      division: p.rank_division,
    })),
  ).label;
}
