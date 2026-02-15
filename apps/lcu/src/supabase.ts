import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Packaged app: use embedded config (written at build time). Dev: use .env (loaded in main).
const configPath = path.join(__dirname, "supabase-config.json");
let url: string | undefined;
let key: string | undefined;

if (fs.existsSync(configPath)) {
  try {
    const data = JSON.parse(
      fs.readFileSync(configPath, "utf8"),
    ) as { SUPABASE_URL?: string; SUPABASE_SERVICE_KEY?: string };
    url = data.SUPABASE_URL;
    key = data.SUPABASE_SERVICE_KEY;
  } catch {
    // ignore invalid json
  }
}

if (!url || !key) {
  url = process.env.SUPABASE_URL;
  key = process.env.SUPABASE_SERVICE_KEY;
}

if (!url || !key) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set (e.g. in .env for dev, or build with embed-config for production).",
  );
}

export const supabase = createClient(url, key);
