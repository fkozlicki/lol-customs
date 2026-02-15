import fs from "node:fs";
import path from "node:path";

export interface LcuConfig {
  lolDirectory: string | null;
}

const CONFIG_FILENAME = "lcu-config.json";

function getConfigPath(userDataPath: string): string {
  return path.join(userDataPath, CONFIG_FILENAME);
}

export function loadConfig(userDataPath: string): LcuConfig {
  const configPath = getConfigPath(userDataPath);
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const data = JSON.parse(raw) as LcuConfig;
    return {
      lolDirectory:
        typeof data.lolDirectory === "string" ? data.lolDirectory : null,
    };
  } catch {
    return { lolDirectory: null };
  }
}

export function saveConfig(
  userDataPath: string,
  config: LcuConfig,
): void {
  const configPath = getConfigPath(userDataPath);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
}
