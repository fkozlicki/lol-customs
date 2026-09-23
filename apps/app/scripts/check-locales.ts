/**
 * Fails when the two locale files have drifted apart.
 *
 * Every user-facing string goes into both `en.ts` and `pl.ts` (DESIGN.md rule 9). A key added to one
 * and forgotten in the other does not break the build — next-international falls back to the key
 * path, so the UI quietly shows `dashboard.pages.posts.reactionFailed` to whoever is reading in the
 * other language. This catches that at lint time.
 *
 * It compares shapes, not translations: a key must exist in both, and be a string in both or an
 * object in both.
 */
import en from "../src/locales/en";
import pl from "../src/locales/pl";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Map<string, "string" | "object"> {
  const out = new Map<string, "string" | "object">();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out.set(path, "string");
    } else {
      out.set(path, "object");
      for (const [nested, kind] of flatten(value, path)) {
        out.set(nested, kind);
      }
    }
  }
  return out;
}

const english = flatten(en as unknown as Tree);
const polish = flatten(pl as unknown as Tree);

const missingInPolish = [...english.keys()].filter((k) => !polish.has(k));
const missingInEnglish = [...polish.keys()].filter((k) => !english.has(k));
const mismatched = [...english.entries()]
  .filter(([key, kind]) => polish.has(key) && polish.get(key) !== kind)
  .map(([key]) => key);

const problems = [
  ["missing from pl.ts", missingInPolish],
  ["missing from en.ts", missingInEnglish],
  ["a string in one file and a group in the other", mismatched],
] as const;

if (problems.every(([, keys]) => keys.length === 0)) {
  process.exit(0);
}

console.error(
  `\nLocale check failed. ${english.size} keys in en.ts, ${polish.size} in pl.ts.\n`,
);

for (const [label, keys] of problems) {
  if (keys.length === 0) continue;
  console.error(`${keys.length} ${label}:`);
  for (const key of keys) console.error(`  ${key}`);
  console.error("");
}

console.error(
  "Every user-facing string goes into both locale files. See DESIGN.md.\n",
);
process.exit(1);
