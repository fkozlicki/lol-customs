/**
 * Build-time script: reads SUPABASE_URL and SUPABASE_SERVICE_KEY from .env
 * and writes dist/supabase-config.json so the packaged app works without
 * users having to create any config files. Run after tsc, before electron-builder.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load .env (simple parse, no dotenv dependency in script)
let url = process.env.SUPABASE_URL;
let key = process.env.SUPABASE_SERVICE_KEY;
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*SUPABASE_URL\s*=\s*(.+)$/);
    if (m) url = m[1].trim().replace(/^["']|["']$/g, "");
    const k = line.match(/^\s*SUPABASE_SERVICE_KEY\s*=\s*(.+)$/);
    if (k) key = k[1].trim().replace(/^["']|["']$/g, "");
  }
}

if (!url || !key) {
  console.error(
    "embed-config: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in apps/lcu/.env when building for production.",
  );
  process.exit(1);
}

const distDir = join(root, "dist");
mkdirSync(distDir, { recursive: true });
const outPath = join(distDir, "supabase-config.json");
writeFileSync(
  outPath,
  JSON.stringify({ SUPABASE_URL: url, SUPABASE_SERVICE_KEY: key }),
  "utf8",
);
console.log("embed-config: wrote", outPath);
