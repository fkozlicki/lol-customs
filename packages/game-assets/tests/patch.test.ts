import { describe, expect, test } from "bun:test";
import { GENERATED_PATCH } from "../src/champions";
import { latestPatch, VERSIONS_URL } from "../src/patch";

const answering = (status: number, body: string) => async () =>
  new Response(body, { status });

describe("the latest patch", () => {
  test("is the first of Data Dragon's versions", async () => {
    const seen: string[] = [];
    const patch = await latestPatch({
      fetch: async (input) => {
        seen.push(input);
        return new Response(JSON.stringify(["16.20.1", "16.19.1"]));
      },
    });
    expect(patch).toBe("16.20.1");
    expect(seen).toEqual([VERSIONS_URL]);
  });

  test("passes the caller's request options along", async () => {
    let received: RequestInit | undefined;
    await latestPatch({
      init: { cache: "force-cache" },
      fetch: async (_, init) => {
        received = init;
        return new Response("[]");
      },
    });
    expect(received).toEqual({ cache: "force-cache" });
  });

  describe("falls back to the generated patch", () => {
    test("when Data Dragon errors", async () => {
      expect(await latestPatch({ fetch: answering(503, "") })).toBe(
        GENERATED_PATCH,
      );
    });

    test("when the answer is not JSON", async () => {
      expect(await latestPatch({ fetch: answering(200, "<html>") })).toBe(
        GENERATED_PATCH,
      );
    });

    test("when the answer is not a list of versions", async () => {
      expect(await latestPatch({ fetch: answering(200, "{}") })).toBe(
        GENERATED_PATCH,
      );
      expect(await latestPatch({ fetch: answering(200, "[16]") })).toBe(
        GENERATED_PATCH,
      );
    });

    test("when the network fails", async () => {
      const offline = async () => {
        throw new TypeError("fetch failed");
      };
      expect(await latestPatch({ fetch: offline })).toBe(GENERATED_PATCH);
    });
  });
});
