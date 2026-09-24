/**
 * Fails when a file hardcodes a colour instead of using a design token.
 *
 * See DESIGN.md: colour only ever carries domain meaning, and every colour in the app comes from a
 * token in packages/ui/src/styles/tokens.css so that both themes stay in sync. This is a grep, not a
 * design review — it covers the colour rules only. Put `design-check-ignore` in a comment on a line
 * that is a false positive, with a reason.
 *
 * It scans both tiers: the app's own components and the shared primitives they are built on. It does
 * not scan apps/lcu, which has its own look and is not held to these rules.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "..",
  "..",
);
const SCANNED = [join("apps", "app", "src"), join("packages", "ui", "src")];
const EXTENSIONS = [".ts", ".tsx", ".css"];
/** Where the tokens themselves are declared, so literal colour values belong here. */
const TOKEN_FILE = join("packages", "ui", "src", "styles", "tokens.css");
const IGNORE_MARKER = "design-check-ignore";

const PALETTE = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
].join("|");

const UTILITIES = [
  "bg",
  "text",
  "border",
  "ring",
  "outline",
  "fill",
  "stroke",
  "decoration",
  "divide",
  "from",
  "via",
  "to",
  "shadow",
  "accent",
  "caret",
  "placeholder",
].join("|");

interface Rule {
  id: string;
  pattern: RegExp;
  message: string;
  /** Files where the rule does not apply, relative to the repo root. */
  skip?: string;
}

const RULES: Rule[] = [
  {
    id: "palette-class",
    pattern: new RegExp(`\\b(?:${UTILITIES})-(?:${PALETTE})-\\d{2,3}\\b`, "g"),
    message:
      "Tailwind palette class. Use a token: bg-card, text-muted-foreground, text-win, bg-mvp-surface.",
  },
  {
    id: "black-or-white",
    pattern: new RegExp(`\\b(?:${UTILITIES})-(?:black|white)\\b`, "g"),
    message:
      "Raw black or white. Use foreground/background tokens so both themes work.",
  },
  {
    id: "literal-colour",
    // A hex colour not preceded by a word character, so Riot IDs like Player#1234 are left alone.
    pattern:
      /(?<![\w&])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\b(?:rgba?|hsla?|oklch)\(/g,
    message:
      "Literal colour value. Declare it as a token in tokens.css and reference the token.",
    skip: TOKEN_FILE,
  },
];

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
    } else if (EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      yield path;
    }
  }
}

interface Violation {
  file: string;
  line: number;
  column: number;
  rule: Rule;
  text: string;
}

const violations: Violation[] = [];

for (const dir of SCANNED) {
  for (const path of walk(join(REPO_ROOT, dir))) {
    const file = relative(REPO_ROOT, path);
    const lines = readFileSync(path, "utf8").split("\n");

    for (const [index, line] of lines.entries()) {
      if (line.includes(IGNORE_MARKER)) continue;

      for (const rule of RULES) {
        if (rule.skip && file === rule.skip) continue;
        rule.pattern.lastIndex = 0;
        for (const match of line.matchAll(rule.pattern)) {
          violations.push({
            file,
            line: index + 1,
            column: (match.index ?? 0) + 1,
            rule,
            text: match[0],
          });
        }
      }
    }
  }
}

if (violations.length === 0) {
  process.exit(0);
}

const byRule = new Map<string, Violation[]>();
for (const violation of violations) {
  const found = byRule.get(violation.rule.id) ?? [];
  found.push(violation);
  byRule.set(violation.rule.id, found);
}

console.error(
  `\nDesign check failed: ${violations.length} hardcoded colour${
    violations.length === 1 ? "" : "s"
  }.\n`,
);

for (const [id, found] of byRule) {
  console.error(`${id}: ${found[0]?.rule.message}`);
  for (const violation of found) {
    console.error(
      `  ${violation.file}:${violation.line}:${violation.column}  ${violation.text}`,
    );
  }
  console.error("");
}

console.error("See DESIGN.md for the tokens to use instead.\n");
process.exit(1);
