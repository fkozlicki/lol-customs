/**
 * Build-time script: reads SUPABASE_*, APP_BASE_URL, UPDATE_FEED_URL from .env
 * and writes dist/supabase-config.json and dist/app-config.json so the packaged
 * app works without users having to create any config files. Run after tsc, before electron-builder.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load .env (simple parse, no dotenv dependency in script)
let url = process.env.SUPABASE_URL;
let key = process.env.SUPABASE_SERVICE_KEY;
let appBaseUrl = process.env.APP_BASE_URL;
let updateFeedUrl = process.env.UPDATE_FEED_URL;
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*SUPABASE_URL\s*=\s*(.+)$/);
    if (m) url = m[1].trim().replace(/^["']|["']$/g, "");
    const k = line.match(/^\s*SUPABASE_SERVICE_KEY\s*=\s*(.+)$/);
    if (k) key = k[1].trim().replace(/^["']|["']$/g, "");
    const a = line.match(/^\s*APP_BASE_URL\s*=\s*(.+)$/);
    if (a) appBaseUrl = a[1].trim().replace(/^["']|["']$/g, "");
    const u = line.match(/^\s*UPDATE_FEED_URL\s*=\s*(.+)$/);
    if (u) updateFeedUrl = u[1].trim().replace(/^["']|["']$/g, "");
  }
}

if (!url || !key) {
  console.error(
    "embed-config: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in apps/lcu/.env when building for production.",
  );
  process.exit(1);
}
if (!appBaseUrl || !updateFeedUrl) {
  console.error(
    "embed-config: APP_BASE_URL and UPDATE_FEED_URL must be set in apps/lcu/.env when building for production.",
  );
  process.exit(1);
}

const distDir = join(root, "dist");
mkdirSync(distDir, { recursive: true });
writeFileSync(
  join(distDir, "supabase-config.json"),
  JSON.stringify({ SUPABASE_URL: url, SUPABASE_SERVICE_KEY: key }),
  "utf8",
);
writeFileSync(
  join(distDir, "app-config.json"),
  JSON.stringify({ APP_BASE_URL: appBaseUrl, UPDATE_FEED_URL: updateFeedUrl }),
  "utf8",
);
console.log("embed-config: wrote supabase-config.json and app-config.json");
