import { describe, expect, test } from "bun:test";
import { MATCH } from "./match.fixtures";
import { type Match, toMatchCardView } from "./match-view";

const view = toMatchCardView(MATCH, { season: null });
const everyone = [...view.blue.participants, ...view.red.participants];
const byKey = (key: string) => everyone.find((p) => p.key === key)!;

/** The fixture with one participant changed, for cases the real match does not have. */
function withParticipant(
  index: number,
  change: Partial<Match["match_participants"][number]>,
): Match {
  return {
    ...MATCH,
    match_participants: MATCH.match_participants.map((p, i) =>
      i === index ? { ...p, ...change } : p,
    ),
  };
}

describe("sides", () => {
  test("split the ten players five and five, with the result from the teams row", () => {
    expect(view.blue.participants).toHaveLength(5);
    expect(view.red.participants).toHaveLength(5);
    expect(view.blue.won).toBe(true);
    expect(view.red.won).toBe(false);
  });

  test("total their kills and gold", () => {
    expect(view.blue.kills).toBe(35);
    expect(view.red.kills).toBe(38);
    expect(view.blue.gold).toBe(73070);
    expect(view.red.gold).toBe(72866);
  });
});

describe("the point of view", () => {
  test("is neutral in the list", () => {
    expect(view.player).toBeNull();
  });

  test("is the profile owner's on a profile", () => {
    const puuid = MATCH.match_participants[3]!.puuid;
    expect(toMatchCardView(MATCH, { puuid, season: null }).player?.key).toBe(
      puuid,
    );
  });
});

describe("MVP and ACE", () => {
  test("are the players the database marked", () => {
    expect(view.mvp?.key).toBe(
      MATCH.match_participants.find((p) => p.is_mvp)!.puuid,
    );
    expect(view.ace?.key).toBe(
      MATCH.match_participants.find((p) => p.is_ace)!.puuid,
    );
    expect(view.mvp?.badge).toBe("mvp");
    expect(view.ace?.badge).toBe("ace");
  });

  test("are absent from a match rated before they existed", () => {
    const old = toMatchCardView(
      {
        ...MATCH,
        match_participants: MATCH.match_participants.map((p) => ({
          ...p,
          is_mvp: false,
          is_ace: false,
        })),
      },
      { season: null },
    );
    expect(old.mvp).toBeNull();
    expect(old.ace).toBeNull();
  });
});

describe("a player's line", () => {
  test("places them by OP score across the whole match", () => {
    const places = everyone
      .filter((p) => p.place != null)
      .sort((a, b) => a.place! - b.place!);
    expect(places[0]!.opScore).toBe(
      Math.max(...everyone.map((p) => p.opScore ?? 0)),
    );
    expect(places.map((p) => p.place)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test("counts kill participation against their own side's kills", () => {
    const p = MATCH.match_participants[0]!;
    const line = byKey(p.puuid);
    expect(line.killParticipation).toBe(
      Math.round((((p.kills ?? 0) + (p.assists ?? 0)) / view.blue.kills) * 100),
    );
  });

  test("scales damage against the highest in the match", () => {
    expect(Math.max(...everyone.map((p) => p.damageDealtShare))).toBe(100);
    expect(Math.max(...everyone.map((p) => p.damageTakenShare))).toBe(100);
  });

  test("leaves a perfect KDA for the recipe to translate", () => {
    const perfect = toMatchCardView(withParticipant(0, { deaths: 0 }), {
      season: null,
    });
    expect(perfect.blue.participants[0]!.kdaRatio).toBeNull();
    expect(byKey(MATCH.match_participants[0]!.puuid).kdaRatio).toBe("1.18:1");
  });

  test("labels the rank, and leaves no rank for the recipe to translate", () => {
    expect(byKey(MATCH.match_participants[0]!.puuid).rankLabel).toBe(
      "diamond IV",
    );
    const unranked = MATCH.match_participants.find((p) => !p.rank_tier)!;
    expect(byKey(unranked.puuid).rankLabel).toBeNull();
  });

  test("reads spells and items from Riot's JSON, skipping empty spell slots", () => {
    const line = byKey(MATCH.match_participants[0]!.puuid);
    expect(line.spellIds).toEqual([4, 14]);
    expect(line.itemIds).toEqual([1055, 3078, 3047, 6610, 6333, 1036, 3340]);
  });

  test("keeps seven empty item slots when Riot's JSON has no entry", () => {
    const bare = toMatchCardView(
      { ...MATCH, raw_json: { participants: [] } },
      { season: null },
    );
    expect(bare.blue.participants[0]!.itemIds).toEqual(Array(7).fill(null));
    expect(bare.blue.participants[0]!.spellIds).toEqual([]);
  });
});

describe("links", () => {
  test("go to the player's profile", () => {
    expect(byKey(MATCH.match_participants[0]!.puuid).href).toBe(
      "/players/Kestrel-EUNE",
    );
  });

  test("carry the season in view", () => {
    const seasonal = toMatchCardView(MATCH, { season: "2" });
    expect(seasonal.blue.participants[0]!.href).toBe(
      "/players/Kestrel-EUNE?season=2",
    );
  });

  test("go nowhere without a Riot ID", () => {
    const anonymous = toMatchCardView(
      withParticipant(0, {
        players: { ...MATCH.match_participants[0]!.players, tag_line: null },
      }),
      { season: "2" },
    );
    expect(anonymous.blue.participants[0]!.href).toBe("#");
  });
});

test("formats the duration", () => {
  expect(view.duration).toBe("35:51");
});
