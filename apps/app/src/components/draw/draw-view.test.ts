import { expect, test } from "bun:test";
import { toDrawnTeamView } from "./draw-view";

test("a drawn team keeps each player's role and captaincy", () => {
  const view = toDrawnTeamView({
    avgRankLabel: "Gold II",
    avgRankTier: "GOLD",
    players: [
      {
        gameName: "Kestrel",
        tagLine: "EUNE",
        rankTier: null,
        rankDivision: null,
        role: "JUNGLE",
        isCaptain: true,
      },
    ],
  });
  expect(view.players[0]).toMatchObject({
    name: "Kestrel",
    role: "JUNGLE",
    isCaptain: true,
    rankLabel: null,
  });
  expect(view.avgRankLabel).toBe("Gold II");
});
