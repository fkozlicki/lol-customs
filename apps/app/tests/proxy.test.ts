import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

// Next strips its own router headers (`rsc`, `next-router-prefetch`, …) before the proxy runs, so these
// requests carry only what survives: the cookie and the browser's `Sec-Fetch-Mode`.
const request = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(`https://derby.test${path}`, {
    headers: { cookie: "derby-season=1", ...headers },
  });

describe("remembered season", () => {
  test("a page load without ?season= goes to the remembered season", () => {
    const response = proxy(
      request("/matches", { "sec-fetch-mode": "navigate" }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://derby.test/matches?season=1",
    );
  });

  test("a request without Sec-Fetch-Mode is treated as a page load", () => {
    const response = proxy(request("/"));
    expect(response.headers.get("location")).toBe(
      "https://derby.test/?season=1",
    );
  });

  // Next prefetches a link's route tree without its search params. Redirecting that prefetch makes
  // the router treat `/` as a redirect to `/?season=1`, so `/?season=1&after=17` snaps back to it.
  test("the router's own fetches are never redirected", () => {
    const response = proxy(request("/", { "sec-fetch-mode": "cors" }));
    expect(response.headers.get("location")).toBeNull();
  });
});

// The locale never shows in the URL: the proxy rewrites to the `[locale]` segment internally.
describe("locale", () => {
  const plain = (path: string, headers: Record<string, string>) =>
    new NextRequest(`https://derby.test${path}`, { headers });
  const rewrite = (response: Response) =>
    response.headers.get("x-middleware-rewrite");

  test("comes from Accept-Language on a first visit", () => {
    const response = proxy(
      plain("/matches", { "accept-language": "pl-PL,pl;q=0.9" }),
    );
    expect(rewrite(response)).toBe("https://derby.test/pl/matches");
  });

  test("comes from the cookie next-international set, which outranks the browser", () => {
    const response = proxy(
      plain("/matches", {
        "accept-language": "pl-PL,pl;q=0.9",
        cookie: "Next-Locale=en",
      }),
    );
    expect(rewrite(response)).toBe("https://derby.test/en/matches");
  });

  test("falls back to English", () => {
    const response = proxy(plain("/", { "accept-language": "de-DE" }));
    expect(rewrite(response)).toBe("https://derby.test/en");
  });
});
