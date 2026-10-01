import { describe, expect, test } from "bun:test";
import { toStandingsRowView } from "@/components/home/standings-view";
import { STANDINGS } from "./standings.fixtures";

const [leader] = STANDINGS;
const qualifying = STANDINGS.find((row) => !row.qualified)!;

describe("a standings row", () => {
  test("keeps the position of a qualified player", () => {
    expect(toStandingsRowView(leader!, { season: null }).position).toBe(1);
  });

  test("has no position while the player is still qualifying", () => {
    const view = toStandingsRowView(qualifying, { season: null });
    expect(view.position).toBeNull();
    expect(view.matchesPlayed).toBe(qualifying.matches_played);
  });

  test("rounds the rating and formats the record with the domain's rules", () => {
    const view = toStandingsRowView(leader!, { season: null });
    expect(view.rating).toBe(Math.round(leader!.rating ?? 0));
    expect(view.winrate).toBe("71%");
    expect(view.kdaRatio).toMatch(/:1$/);
  });

  test("links to the profile with the season in view", () => {
    expect(toStandingsRowView(leader!, { season: "all" }).href).toBe(
      "/players/Kestrel-EUNE?season=all",
    );
  });

  test("falls back to the start of the puuid without a Riot ID", () => {
    // A puuid seen in a match whose player row has not been written yet.
    const anonymous = { ...leader!, player: null } as never;
    expect(toStandingsRowView(anonymous, { season: null }).name).toBe(
      leader!.puuid.slice(0, 8),
    );
  });
});
