import { describe, expect, test } from "bun:test";
import { createElement, isValidElement } from "react";
import en from "./en";
import { format, lookup } from "./format";
import pl from "./pl";

describe("lookup", () => {
  const strings = { match: { victory: "Victory" } };

  test("reads a dotted path", () => {
    expect(lookup(strings, "match.victory")).toBe("Victory");
  });

  test("falls back to the path, as next-international does", () => {
    expect(lookup(strings, "match.defeat")).toBe("match.defeat");
    expect(lookup(strings, "match")).toBe("match");
  });
});

describe("format", () => {
  test("returns the template untouched without params", () => {
    expect(format("Best {count}")).toBe("Best {count}");
  });

  test("fills every placeholder", () => {
    expect(
      format("{matches} of {count} matches", { matches: 3, count: 5 }),
    ).toBe("3 of 5 matches");
  });

  test("returns nodes when a param is an element", () => {
    const name = createElement("b", null, "Faker");
    const result = format("Hello {name}!", { name });

    expect(Array.isArray(result)).toBe(true);
    const parts = result as unknown[];
    expect(parts[0]).toBe("Hello ");
    expect(isValidElement(parts[1])).toBe(true);
    expect(parts[2]).toBe("!");
  });
});

/** Every leaf path in a dictionary, with the placeholders its string uses. */
function leaves(node: object, prefix = ""): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [key, value] of Object.entries(node)) {
    const path = `${prefix}${key}`;
    if (typeof value === "string") {
      out.set(
        path,
        [...value.matchAll(/{([^}]*)}/g)].map((m) => m[1] ?? "").sort(),
      );
    } else {
      for (const [p, params] of leaves(value, `${path}.`)) out.set(p, params);
    }
  }
  return out;
}

test("Polish uses the same placeholders as English", () => {
  const english = leaves(en);
  const polish = leaves(pl);

  for (const [path, params] of english) {
    expect({ path, params: polish.get(path) }).toEqual({ path, params });
  }
});
