import { expect, test } from "bun:test";
import en from "./en";
import pl from "./pl";

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
