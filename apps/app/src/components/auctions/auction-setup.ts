import { AUCTION_POOL_SIZE } from "@v1/domain/auction";
import type { AuctionSettings } from "@v1/ui/recipes/auctions/auction-settings";

/** The ranges the auctions router accepts. */
const BUDGET = { min: 4, max: 100 };
const BID_SECONDS = { min: 10, max: 60 };
const TEAM_NAME_MAX = 100;

const within = (value: number, { min, max }: { min: number; max: number }) =>
  value >= min && value <= max;

/** Whether the router would take this setup: a full pool, rules in range, and a team name when creating. */
export function canSubmitAuctionSetup({
  mode,
  poolCount,
  settings,
}: {
  mode: "create" | "edit";
  poolCount: number;
  settings: AuctionSettings;
}): boolean {
  const teamNameOk =
    mode === "edit" ||
    (settings.teamName.trim().length > 0 &&
      settings.teamName.length <= TEAM_NAME_MAX);
  return (
    poolCount === AUCTION_POOL_SIZE &&
    teamNameOk &&
    within(settings.budget, BUDGET) &&
    within(settings.bidSeconds, BID_SECONDS)
  );
}
