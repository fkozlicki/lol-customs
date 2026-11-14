import { describe, expect, test } from "bun:test";
import {
  type AuctionRoomFacts,
  auctionPermissions,
  isAuctionRule,
} from "../src/auction";

const captainA = { side: "A" as const, budgetRemaining: 20 };
const captainB = { side: "B" as const, budgetRemaining: 20 };
const visitor = { signedIn: false, isCreator: false, side: null };
const signedIn = { signedIn: true, isCreator: false, side: null };
const creator = { signedIn: true, isCreator: true, side: "A" as const };
const second = { signedIn: true, isCreator: false, side: "B" as const };

function room(facts: Partial<AuctionRoomFacts>): AuctionRoomFacts {
  return {
    status: "waiting",
    phase: null,
    currentBid: 0,
    leadingSide: null,
    captains: [captainA],
    viewer: visitor,
    ...facts,
  };
}

function allowed(facts: Partial<AuctionRoomFacts>) {
  const permissions = auctionPermissions(room(facts));
  return Object.entries(permissions)
    .filter(([, value]) => value)
    .map(([name]) => name)
    .sort();
}

describe("in the lobby", () => {
  test("a signed-in viewer may take the free captain seat, a visitor may do nothing", () => {
    expect(allowed({ viewer: signedIn })).toEqual(["canJoin"]);
    expect(allowed({ viewer: visitor })).toEqual([]);
  });

  test("nobody may join once both seats are taken, or after the countdown starts", () => {
    expect(
      allowed({ viewer: signedIn, captains: [captainA, captainB] }),
    ).toEqual([]);
    expect(allowed({ viewer: signedIn, status: "countdown" })).toEqual([]);
  });

  test("the creator edits and cancels, and with a second captain also readies and removes them", () => {
    expect(allowed({ viewer: creator })).toEqual(["canCancel", "canEditLobby"]);
    expect(
      allowed({ viewer: creator, captains: [captainA, captainB] }),
    ).toEqual(["canCancel", "canEditLobby", "canReady", "canRemoveCaptain"]);
  });

  test("the second captain readies and leaves", () => {
    expect(allowed({ viewer: second, captains: [captainA, captainB] })).toEqual(
      ["canLeave", "canReady"],
    );
  });
});

describe("while bidding", () => {
  const bidding = {
    status: "active" as const,
    phase: "bidding" as const,
    currentBid: 5,
    leadingSide: "A" as const,
    captains: [captainA, captainB],
  };

  test("the trailing captain may outbid or concede, the leader neither", () => {
    expect(allowed({ ...bidding, viewer: second })).toEqual([
      "canBid",
      "canConcede",
    ]);
    expect(allowed({ ...bidding, viewer: creator })).toEqual(["canCancel"]);
  });

  test("a captain who cannot top the bid may only concede", () => {
    expect(
      allowed({
        ...bidding,
        viewer: second,
        captains: [captainA, { side: "B", budgetRemaining: 5 }],
      }),
    ).toEqual(["canConcede"]);
  });

  test("a free auction is decided by the side it fell to", () => {
    const free = { ...bidding, phase: "free_auction" as const };
    expect(allowed({ ...free, viewer: creator })).toEqual([
      "canCancel",
      "canDecideFreeAuction",
    ]);
    expect(allowed({ ...free, viewer: second })).toEqual([]);
  });
});

test("a finished auction allows nothing, not even cancelling", () => {
  expect(
    allowed({
      status: "completed",
      viewer: creator,
      captains: [captainA, captainB],
    }),
  ).toEqual([]);
});

test("only the listed rules count as auction rules", () => {
  expect(isAuctionRule("AUCTION_BID_TOO_LOW")).toBe(true);
  expect(isAuctionRule("AUCTION_SOMETHING_NEW")).toBe(false);
  expect(isAuctionRule(undefined)).toBe(false);
});
