/** Solo/Duo tier + division → numeric ladder position (shared match logic). */

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

export const RANK_DIVISION_ORDER = ["IV", "III", "II", "I"] as const;

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
  const isApex =
    tierUpper === "MASTER" ||
    tierUpper === "GRANDMASTER" ||
    tierUpper === "CHALLENGER";
  if (isApex) {
    return tierIdx * 4 + 3;
  }
  const divUpper = (division ?? "IV").toUpperCase();
  const divIdx = RANK_DIVISION_ORDER.indexOf(
    divUpper as (typeof RANK_DIVISION_ORDER)[number],
  );
  const divNum = divIdx === -1 ? 0 : divIdx;
  return tierIdx * 4 + divNum;
}

export function numericToRank(n: number): { tier: string; division: string } {
  const tierIdx = Math.min(Math.floor(n / 4), RANK_TIER_ORDER.length - 1);
  const tier = RANK_TIER_ORDER[tierIdx];
  const isApex =
    tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER";
  const div = RANK_DIVISION_ORDER[Math.round(n % 4) % 4];
  const division: string = isApex ? "I" : (div ?? "IV");
  return { tier, division } as { tier: string; division: string };
}

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
  const divLabel =
    tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER"
      ? ""
      : ` ${division}`;
  const label = `${tier.toLowerCase()}${divLabel}`.trim();
  return { label, tier };
}

export function averageSoloRankLabel(
  snapshots: { tier: string | null; division: string | null }[],
): string {
  return averageSoloRankMeta(snapshots).label;
}

export function formatSoloRankDisplay(
  tier: string,
  rankDivision: string,
): string {
  const apex = ["MASTER", "GRANDMASTER", "CHALLENGER"];
  if (apex.includes(tier.toUpperCase())) return tier;
  return `${tier} ${rankDivision}`.trim();
}
