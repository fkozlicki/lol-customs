import fs from "node:fs";
import type { IncomingMessage } from "node:http";
import https from "node:https";
import path from "node:path";

/** Default lockfile paths per platform (for auto-detect). Full path to lockfile. */
function getDefaultLockfileCandidates(): string[] {
  const platform = process.platform;
  const candidates: string[] = [];

  if (platform === "win32") {
    const local = process.env.LOCALAPPDATA ?? "";
    if (local) {
      candidates.push(
        path.join(local, "Riot Games", "League of Legends", "lockfile"),
      );
    }
  } else if (platform === "darwin") {
    const home = process.env.HOME ?? "";
    if (home) {
      candidates.push(
        path.join(
          home,
          "Library",
          "Application Support",
          "Riot Games",
          "League of Legends",
          "lockfile",
        ),
      );
    }
  } else if (platform === "linux") {
    const home = process.env.HOME ?? "";
    const user = process.env.USER ?? "user";
    if (home) {
      candidates.push(
        path.join(
          home,
          ".wine",
          "drive_c",
          "users",
          user,
          "Local Settings",
          "Application Data",
          "Riot Games",
          "League of Legends",
          "lockfile",
        ),
      );
    }
  }

  return candidates;
}

/**
 * League of Legends directory = folder that contains the lockfile.
 * Use this when you have a user-selected or stored path.
 */
export function getLockfilePath(lolDirectory: string): string {
  const lockPath = path.join(lolDirectory, "lockfile");
  if (!path.isAbsolute(lolDirectory)) {
    throw new Error("League of Legends directory must be an absolute path");
  }
  return lockPath;
}

/**
 * Try default install locations; returns the directory containing lockfile, or null.
 */
export function detectLolDirectory(): string | null {
  for (const lockPath of getDefaultLockfileCandidates()) {
    if (fs.existsSync(lockPath)) {
      return path.dirname(lockPath);
    }
  }
  return null;
}

/**
 * Check if the given directory contains a valid lockfile (client running).
 */
export function isLockfileInDirectory(lolDirectory: string): boolean {
  try {
    const lockPath = getLockfilePath(lolDirectory);
    return fs.existsSync(lockPath);
  } catch {
    return false;
  }
}

export interface LockfileData {
  port: number;
  password: string;
  protocol: string;
}

export function readLockfile(lolDirectory: string): LockfileData {
  const lockPath = getLockfilePath(lolDirectory);
  const raw = fs.readFileSync(lockPath, "utf8").trim();
  // Format: name:pid:port:password:protocol
  const parts = raw.split(":");
  const port = Number.parseInt(parts[2] ?? "0", 10);
  const password = parts[3] ?? "";
  const protocol = parts[4] ?? "https";
  if (!port || !password) {
    throw new Error("Invalid lockfile: missing port or password");
  }
  return { port, password, protocol };
}

function lcuRequest<T>(
  port: number,
  password: string,
  pathSegment: string,
): Promise<{ data: T }> {
  const auth = Buffer.from(`riot:${password}`).toString("base64");
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "127.0.0.1",
        port,
        path: pathSegment,
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        rejectUnauthorized: false,
      },
      (res: IncomingMessage) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve({ data: JSON.parse(body) as T });
            } catch (e) {
              reject(new Error(`LCU ${pathSegment}: invalid JSON`));
            }
          } else {
            reject(
              new Error(
                `LCU ${pathSegment}: ${res.statusCode ?? ""} ${res.statusMessage ?? ""}`,
              ),
            );
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

export function createLcuClient(lolDirectory: string) {
  const { port, password } = readLockfile(lolDirectory);
  return {
    get: async <T>(pathSegment: string): Promise<{ data: T }> =>
      lcuRequest<T>(port, password, pathSegment),
  };
}
