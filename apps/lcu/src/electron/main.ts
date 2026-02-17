import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { config } from "dotenv";
import { app, BrowserWindow, dialog, ipcMain, net, protocol } from "electron";
import { autoUpdater } from "electron-updater";
import semver from "semver";

// In dev: .env next to package.json. When packaged: .env in app userData (e.g. %APPDATA%\Rift Rank LCU\.env).
const envPath =
  process.env.NODE_ENV === "development" || process.env.ELECTRON_DEV === "1"
    ? path.join(__dirname, "..", "..", ".env")
    : path.join(app.getPath("userData"), ".env");
config({ path: envPath });

import { loadConfig, saveConfig } from "../config.js";
import { detectLolDirectory, isLockfileInDirectory } from "../lcu.js";
import {
  fetchGamesForUi,
  saveSelectedMatches,
} from "../sync.js";

interface AppConfig {
  APP_BASE_URL: string;
  UPDATE_FEED_URL: string;
}

function loadAppConfig(): AppConfig | null {
  try {
    const configPath = path.join(__dirname, "..", "app-config.json");
    const raw = fs.readFileSync(configPath, "utf8");
    const data = JSON.parse(raw) as AppConfig;
    if (
      typeof data.APP_BASE_URL === "string" &&
      typeof data.UPDATE_FEED_URL === "string"
    ) {
      return data;
    }
  } catch {
    // In dev or if app-config.json is missing
  }
  return null;
}

// Register custom scheme before app ready (required for protocol.handle).
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true } },
]);

const isDev =
  process.env.NODE_ENV === "development" || process.env.ELECTRON_DEV === "1";

const outDir = path.join(__dirname, "..", "..", "out");

async function runVersionCheckAndUpdater(win: BrowserWindow): Promise<void> {
  const currentVersion = app.getVersion();

  if (isDev) {
    win.webContents.send("version-check-result", { allowed: true });
    return;
  }

  const appConfig = loadAppConfig();
  if (!appConfig) {
    win.webContents.send("version-check-result", { allowed: true });
    return;
  }

  try {
    const base = appConfig.APP_BASE_URL.replace(/\/$/, "");
    const res = await fetch(`${base}/api/lcu/minimum-version`);
    if (!res.ok) throw new Error("Version check failed");
    const data = (await res.json()) as {
      minimumVersion: string;
      downloadUrl: string;
    };
    const minimumVersion = data.minimumVersion ?? "0.0.0";
    const downloadUrl = data.downloadUrl ?? "";

    if (
      semver.valid(minimumVersion) &&
      semver.lt(currentVersion, minimumVersion)
    ) {
      win.webContents.send("version-check-result", {
        allowed: false,
        downloadUrl,
      });
      const { response } = await dialog.showMessageBox(win, {
        type: "info",
        title: "Update required",
        message:
          "A new version of Rift Rank LCU is required. Please download the latest version.",
        detail: downloadUrl ? `Download: ${downloadUrl}` : undefined,
        buttons: ["Quit"],
      });
      if (response === 0) app.quit();
      return;
    }
  } catch {
    // Network error or invalid response: allow app to run
  }

  win.webContents.send("version-check-result", { allowed: true });

  // Configure and run auto-updater
  autoUpdater.setFeedURL({
    provider: "generic",
    url: appConfig.UPDATE_FEED_URL,
  });
  autoUpdater.checkForUpdatesAndNotify().catch((err: unknown) => {
    console.error("Update check failed:", err);
  });

  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox(win, {
        type: "info",
        title: "Update ready",
        message:
          "A new version has been downloaded. Restart the app to install.",
        buttons: ["Restart", "Later"],
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall();
      });
  });
  autoUpdater.on("error", (err: Error) => {
    console.error("Updater error:", err);
  });
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 520,
    height: 620,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:3001");
    win.webContents.openDevTools();
  } else {
    win.loadURL("app://./index.html");
  }

  win.on("closed", () => {});

  win.webContents.on("did-finish-load", () => {
    win.webContents.send("window-maximized-changed", win.isMaximized());
    runVersionCheckAndUpdater(win);
  });
  win.on("maximize", () =>
    win.webContents.send("window-maximized-changed", true),
  );
  win.on("unmaximize", () =>
    win.webContents.send("window-maximized-changed", false),
  );

  return win;
}

ipcMain.on("window-minimize", () => {
  const w = BrowserWindow.getFocusedWindow();
  if (w) w.minimize();
});

ipcMain.on("window-maximize-toggle", () => {
  const w = BrowserWindow.getFocusedWindow();
  if (!w) return;
  if (w.isMaximized()) w.unmaximize();
  else w.maximize();
});

ipcMain.on("window-close", () => {
  const w = BrowserWindow.getFocusedWindow();
  if (w) w.close();
});

app.whenReady().then(() => {
  // Serve static export from out/ so CSS and JS chunks load (file:// would break /_next/... paths).
  if (!isDev) {
    protocol.handle("app", (request) => {
      const url = new URL(request.url);
      const pathname = url.pathname.replace(/^\/+/, "") || "index.html";
      const filePath = path.join(outDir, pathname);
      return net.fetch(pathToFileURL(filePath).href);
    });
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function getEffectiveDirectory(): string | null {
  const userData = app.getPath("userData");
  const cfg = loadConfig(userData);
  if (cfg.lolDirectory) return cfg.lolDirectory;
  return detectLolDirectory();
}

ipcMain.handle("get-config", () => {
  const userData = app.getPath("userData");
  const cfg = loadConfig(userData);
  const detected = detectLolDirectory();
  // Auto-detect on start: if no folder saved, use detected path when available
  if (!cfg.lolDirectory && detected) {
    cfg.lolDirectory = detected;
    saveConfig(userData, cfg);
  }
  const effective = cfg.lolDirectory ?? detected;
  const available = effective ? isLockfileInDirectory(effective) : false;
  return {
    lolDirectory: cfg.lolDirectory,
    detected,
    effectiveDirectory: effective,
    available,
  };
});

ipcMain.handle("open-folder-dialog", async () => {
  const win = BrowserWindow.getAllWindows()[0];
  const opts = {
    properties: ["openDirectory"] as ["openDirectory"],
    title: "Select League of Legends folder",
    message:
      "Select the folder that contains the League client (the folder that contains lockfile when the client is running).",
  };
  const result = win
    ? await dialog.showOpenDialog(win, opts)
    : await dialog.showOpenDialog(opts);

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false as const, error: "No folder selected" };
  }

  const folder = result.filePaths[0];
  if (!folder) {
    return { success: false as const, error: "No folder selected" };
  }
  if (!isLockfileInDirectory(folder)) {
    return {
      success: false as const,
      error:
        "No lockfile found in this folder. Start the League client and log in, then try again. The folder should be the one containing the game (e.g. League of Legends).",
    };
  }

  const userData = app.getPath("userData");
  const cfg = loadConfig(userData);
  cfg.lolDirectory = folder;
  saveConfig(userData, cfg);
  return { success: true as const, path: folder };
});

ipcMain.handle("use-detected", () => {
  const detected = detectLolDirectory();
  if (!detected) {
    return {
      success: false as const,
      error:
        "League client not found. Install League or start the client and log in.",
    };
  }
  const userData = app.getPath("userData");
  const cfg = loadConfig(userData);
  cfg.lolDirectory = detected;
  saveConfig(userData, cfg);
  return { success: true as const, path: detected };
});

ipcMain.handle("client-status", () => {
  const effective = getEffectiveDirectory();
  const userData = app.getPath("userData");
  const cfg = loadConfig(userData);
  const detected = detectLolDirectory();
  return {
    available: effective ? isLockfileInDirectory(effective) : false,
    lolDirectory: cfg.lolDirectory,
    detected,
    effectiveDirectory: effective,
  };
});

ipcMain.handle("fetch-games", async () => {
  const effective = getEffectiveDirectory();
  if (!effective) {
    return {
      success: false,
      error:
        "League of Legends folder not set. Choose a folder or use Auto-detect.",
      games: [],
    };
  }
  try {
    const result = await fetchGamesForUi(effective);
    return { success: true as const, games: result.games };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false as const, error: message, games: [] };
  }
});

ipcMain.handle("save-selected-matches", async (_event, gameIds: number[]) => {
  const effective = getEffectiveDirectory();
  if (!effective) {
    return {
      success: false,
      message:
        "League of Legends folder not set. Choose a folder or use Auto-detect.",
      savedCount: 0,
    };
  }
  return saveSelectedMatches(effective, gameIds ?? []);
});
