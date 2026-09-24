/**
 * Renders every story and fails on the ones that break.
 *
 * `storybook build` compiles stories but never runs them, and the framework preview installs an
 * `onCaughtError` handler, so a story that throws renders empty, logs to the console and reports
 * success everywhere else. That is how a broken `AuthorLine` story shipped: React swallowed a null
 * `useParams()`, nothing reached `pageerror`, and lint, typecheck and the Storybook build were all
 * green.
 *
 * So this asks the only question those cannot: does the story actually put something on the page?
 * Every story is rendered in every locale, because half of what the app renders is locale-dependent.
 *
 * Needs a build first — `bun run build-storybook`.
 */
import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { SUPPORTED_LOCALES } from "../src/locales";

const APP_DIR = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const STATIC_DIR = join(APP_DIR, "storybook-static");

if (!existsSync(join(STATIC_DIR, "index.json"))) {
  console.error(
    `\nNo Storybook build at ${STATIC_DIR}.\nRun \`bun run build-storybook\` in apps/app first.\n`,
  );
  process.exit(1);
}

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

/** A static server small enough to not be worth a dependency; the build is already on disk. */
const server = createServer((request, response) => {
  const path = (request.url ?? "/").split("?")[0] ?? "/";
  const file = join(STATIC_DIR, normalize(path === "/" ? "/index.html" : path));

  if (!file.startsWith(STATIC_DIR) || !existsSync(file)) {
    response.writeHead(404).end("not found");
    return;
  }

  response.writeHead(200, {
    "content-type": CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(response);
});

await new Promise<void>((resolve) => server.listen(0, resolve));
const address = server.address();
if (address === null || typeof address === "string") {
  throw new Error("the static server did not report a port");
}
const origin = `http://localhost:${address.port}`;

interface StoryIndex {
  entries: Record<string, { title: string; name: string }>;
}

const index: StoryIndex = await (await fetch(`${origin}/index.json`)).json();
const stories = Object.entries(index.entries);

interface Failure {
  id: string;
  locale: string;
  title: string;
  reason: string;
}

const failures: Failure[] = [];
const browser = await chromium.launch();

for (const locale of SUPPORTED_LOCALES) {
  const context = await browser.newContext({
    viewport: { width: 900, height: 600 },
    reducedMotion: "reduce",
  });

  for (const [id, entry] of stories) {
    const page = await context.newPage();
    const problems: string[] = [];
    const note = (text: string) => problems.push(text.split("\n")[0] ?? text);

    page.on("pageerror", (error) => note(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") note(message.text());
    });

    await page.goto(
      `${origin}/iframe.html?globals=locale:${locale}&id=${id}&viewMode=story`,
      { waitUntil: "networkidle" },
    );
    // Give effects and any suspended boundary a moment to settle before judging the result.
    await page.waitForTimeout(400);

    // A dialog, sheet or menu renders into a portal on <body>, outside the story root, so both count.
    // Storybook's own nodes do not — including its error screen, which would otherwise pass for
    // content when a story throws.
    const rendered = await page.evaluate(() =>
      Array.from(document.body.children).some((node) => {
        if (
          ["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT"].includes(node.tagName)
        ) {
          return false;
        }
        const isStorybook =
          (node.id.startsWith("storybook-") && node.id !== "storybook-root") ||
          Array.from(node.classList).some((c) => c.startsWith("sb-"));
        return !isStorybook && node.innerHTML.trim() !== "";
      }),
    );

    const reason = problems[0] ?? (rendered ? undefined : "rendered nothing");
    if (reason) {
      failures.push({
        id,
        locale,
        title: `${entry.title} › ${entry.name}`,
        reason,
      });
    }

    await page.close();
  }

  await context.close();
}

await browser.close();
server.close();

const total = stories.length * SUPPORTED_LOCALES.length;

if (failures.length === 0) {
  console.log(
    `\n${total} story renders checked (${stories.length} stories × ${SUPPORTED_LOCALES.length} locales). All good.\n`,
  );
  process.exit(0);
}

console.error(
  `\nStory check failed: ${failures.length} of ${total} renders.\n`,
);
for (const failure of failures) {
  console.error(`  [${failure.locale}] ${failure.title}`);
  console.error(`      ${failure.reason.slice(0, 200)}`);
  console.error(`      ${origin}/?path=/story/${failure.id}\n`);
}
process.exit(1);
