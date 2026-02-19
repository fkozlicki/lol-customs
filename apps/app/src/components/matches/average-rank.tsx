import Image from "next/image";

const RANK_CRESTS_BASE =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/";
const RANK_TIERS_CREST = new Set([
  "iron",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "emerald",
  "diamond",
  "master",
  "grandmaster",
  "challenger",
]);

function averageRankCrestUrl(avgRankLabel: string): string {
  if (avgRankLabel === "—") return `${RANK_CRESTS_BASE}unranked.svg`;
  const tier = avgRankLabel.split(" ")[0]?.toLowerCase() ?? "";
  return RANK_TIERS_CREST.has(tier)
    ? `${RANK_CRESTS_BASE}${tier}.svg`
    : `${RANK_CRESTS_BASE}unranked.svg`;
}

export function AverageRank({ rank }: { rank: string }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">Avg rank:</span>
      <div className="flex items-center gap-0.5">
        <Image
          src={averageRankCrestUrl(rank)}
          alt=""
          width={16}
          height={16}
          className="rounded-sm shrink-0 object-cover"
        />
        <span className="text-xs capitalize">{rank}</span>
      </div>
    </div>
  );
}
