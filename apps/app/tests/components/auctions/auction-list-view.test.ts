import { describe, expect, test } from "bun:test";
import { toAuctionSummaryView } from "@/components/auctions/auction-list-view";

type Auction = Parameters<typeof toAuctionSummaryView>[0];

const auction = (changes: Record<string, unknown>) =>
  ({
    id: "room-1",
    status: "waiting",
    isMine: false,
    teamA: { teamName: "Wolves", captain: "Kestrel" },
    teamB: { teamName: "Team B", captain: null },
    currentPlayer: null,
    currentBid: null,
    ...changes,
  }) as unknown as Auction;

describe("an auction in the list", () => {
  test("links to its room", () => {
    expect(toAuctionSummaryView(auction({})).href).toBe("/auctions/room-1");
  });

  test("names only the captains who joined, and whether the second one has", () => {
    const view = toAuctionSummaryView(auction({}));
    expect(view.captains).toEqual(["Kestrel"]);
    expect(view.hasSecondCaptain).toBe(false);
  });

  test("shows who is on the stage and the price, or nobody and nothing yet", () => {
    expect(toAuctionSummaryView(auction({}))).toMatchObject({
      currentPlayerName: null,
      currentBid: 0,
    });
    expect(
      toAuctionSummaryView(
        auction({
          status: "active",
          currentPlayer: { gameName: "Old Tom" },
          currentBid: 7,
        }),
      ),
    ).toMatchObject({ currentPlayerName: "Old Tom", currentBid: 7 });
  });
});
