import path from "node:path";
import { config } from "dotenv";
import { app, BrowserWindow, dialog, ipcMain } from "electron";

// In dev: .env next to package.json. When packaged: .env in app userData (e.g. %APPDATA%\Custom Ladder LCU\.env).
const envPath =
  process.env.NODE_ENV === "development" || process.env.ELECTRON_DEV === "1"
    ? path.join(__dirname, "..", "..", ".env")
    : path.join(app.getPath("userData"), ".env");
config({ path: envPath });

import { loadConfig, saveConfig } from "../config.js";
import { detectLolDirectory, isLockfileInDirectory } from "../lcu.js";
import { runSync } from "../sync.js";

const isDev =
  process.env.NODE_ENV === "development" || process.env.ELECTRON_DEV === "1";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 520,
    height: 420,
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
    win.loadFile(path.join(__dirname, "..", "..", "out", "index.html"));
  }

  win.on("closed", () => {});
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
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

ipcMain.handle("sync", async () => {
  const effective = getEffectiveDirectory();
  if (!effective) {
    return {
      success: false,
      message:
        "League of Legends folder not set. Choose a folder or use Auto-detect.",
    };
  }
  return runSync(effective);
});
