import { describe, expect, test } from "bun:test";
import {
  hasTitleHolders,
  toHallOfFameView,
} from "@/components/hof/hall-of-fame-view";

type Data = Parameters<typeof toHallOfFameView>[0];

const player = (name: string) => ({
  puuid: `puuid-${name}-0000`,
  game_name: name,
  tag_line: "EUNE",
  profile_icon: 1295,
});
const holders = (...entries: [string, number][]) =>
  entries.map(([name, value]) => ({ player: player(name), value }));

const text = {
  section: (id: string) => `section:${id}`,
  title: (id: string) => `title:${id}`,
  stat: (id: string) => `stat:${id}`,
};

const data = {
  mvp: holders(["Kestrel", 5]),
  never_mvp: holders(["Nightjar", 9]),
  best_win_rate: holders(["Kestrel", 0.714]),
  tilted: holders(["Old Tom", 6], ["Nightjar", 6]),
  most_kills: holders(["Kestrel", 9.44]),
  pacifist: holders(["Old Tom", 2.1]),
  double_trouble: holders(["Wren", 3]),
} as unknown as Data;

const view = toHallOfFameView(data, { locale: "en", season: "2", text });
const section = (id: string) => view.sections.find((s) => s.id === id);

describe("the Hall of Fame view", () => {
  test("knows when nobody holds a title yet", () => {
    expect(hasTitleHolders({} as Data)).toBe(false);
    expect(hasTitleHolders(data)).toBe(true);
  });

  test("names each section and title with the catalog's words", () => {
    expect(section("headline")?.name).toBe("section:headline");
    expect(section("headline")?.pairs[0]?.[0]).toMatchObject({
      title: "title:mvp",
      statLabel: "stat:mvpMatches",
      tone: "mvp",
    });
  });

  test("formats the value by the title's rules", () => {
    expect(section("form")?.pairs[0]?.[0]?.value).toBe("71%");
    expect(section("fighting")?.pairs[0]?.[0]?.value).toBe("9.4");
  });

  test("keeps every pair, held or not, and says nobody holds an empty one", () => {
    const [, ace] = section("headline")?.pairs ?? [];
    expect(ace?.[0]).toMatchObject({ holders: [], value: null });
  });

  test("lets tied players share a title, linked with the season in view", () => {
    const tilted = section("form")?.pairs[1]?.[1];
    expect(tilted?.holders.map((p) => p.name)).toEqual(["Old Tom", "Nightjar"]);
    expect(tilted?.holders[0]?.href).toBe("/players/Old%20Tom-EUNE?season=2");
  });

  test("shows only the unpaired titles somebody holds", () => {
    expect(section("multikills")?.singles.map((t) => t.id)).toEqual([
      "double_trouble",
    ]);
  });

  test("drops a section of unpaired titles nobody holds", () => {
    const empty = toHallOfFameView({ mvp: data.mvp } as unknown as Data, {
      locale: "en",
      season: null,
      text,
    });
    expect(empty.sections.some((s) => s.id === "multikills")).toBe(false);
  });

  test("ranks the collectors by titles held, then by name", () => {
    expect(
      view.mostBest.map(({ player: p, titles }) => [p.name, titles]),
    ).toEqual([
      ["Kestrel", 3],
      ["Wren", 1],
    ]);
    expect(
      view.mostWorst.map(({ player: p, titles }) => [p.name, titles]),
    ).toEqual([
      ["Nightjar", 2],
      ["Old Tom", 2],
    ]);
  });
});
