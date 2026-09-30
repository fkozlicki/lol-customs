import { describe, expect, test } from "bun:test";
import { AUCTION_POOL_SIZE } from "@v1/domain/auction";
import { canSubmitAuctionSetup } from "./auction-setup";

const settings = {
  teamName: "Team A",
  budget: 20,
  bidSeconds: 30,
  revealOrder: false,
};
const create = (
  changes: Partial<typeof settings>,
  poolCount = AUCTION_POOL_SIZE,
) =>
  canSubmitAuctionSetup({
    mode: "create",
    poolCount,
    settings: { ...settings, ...changes },
  });

describe("an auction setup can be sent", () => {
  test("with a full pool and rules in range", () => {
    expect(create({})).toBe(true);
  });

  test("only with the pool full", () => {
    expect(create({}, AUCTION_POOL_SIZE - 1)).toBe(false);
  });

  test("with a budget from 4 to 100", () => {
    expect(create({ budget: 4 })).toBe(true);
    expect(create({ budget: 100 })).toBe(true);
    expect(create({ budget: 3 })).toBe(false);
    expect(create({ budget: 101 })).toBe(false);
  });

  test("with a bid timer from 10 to 60 seconds", () => {
    expect(create({ bidSeconds: 10 })).toBe(true);
    expect(create({ bidSeconds: 60 })).toBe(true);
    expect(create({ bidSeconds: 9 })).toBe(false);
    expect(create({ bidSeconds: 61 })).toBe(false);
  });

  test("not with a number field left empty", () => {
    expect(create({ budget: Number.NaN })).toBe(false);
  });

  test("when creating, only with a team name of at most 100 characters", () => {
    expect(create({ teamName: "   " })).toBe(false);
    expect(create({ teamName: "x".repeat(101) })).toBe(false);
    expect(create({ teamName: "x".repeat(100) })).toBe(true);
  });

  test("when editing a lobby, whatever the team name, which it does not ask for", () => {
    expect(
      canSubmitAuctionSetup({
        mode: "edit",
        poolCount: AUCTION_POOL_SIZE,
        settings: { ...settings, teamName: "" },
      }),
    ).toBe(true);
  });
});
