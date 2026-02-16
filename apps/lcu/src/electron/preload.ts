import { contextBridge, ipcRenderer } from "electron";

// Window controls (custom title bar)
const windowMinimize = () => ipcRenderer.send("window-minimize");
const windowMaximizeToggle = () => ipcRenderer.send("window-maximize-toggle");
const windowClose = () => ipcRenderer.send("window-close");
const onWindowMaximizedChanged = (cb: (maximized: boolean) => void) => {
  ipcRenderer.on("window-maximized-changed", (_event, maximized: boolean) =>
    cb(maximized),
  );
};

const syncResult = () =>
  ipcRenderer.invoke("sync") as Promise<{
    success: boolean;
    message: string;
    savedCount?: number;
    skippedCount?: number;
  }>;

const getConfig = () =>
  ipcRenderer.invoke("get-config") as Promise<{
    lolDirectory: string | null;
    detected: string | null;
    effectiveDirectory: string | null;
    available: boolean;
  }>;

const openFolderDialog = () =>
  ipcRenderer.invoke("open-folder-dialog") as Promise<
    { success: true; path: string } | { success: false; error: string }
  >;

const useDetected = () =>
  ipcRenderer.invoke("use-detected") as Promise<
    { success: true; path: string } | { success: false; error: string }
  >;

const clientStatus = () =>
  ipcRenderer.invoke("client-status") as Promise<{
    available: boolean;
    lolDirectory: string | null;
    detected: string | null;
    effectiveDirectory: string | null;
  }>;

type VersionCheckResult =
  | { allowed: true }
  | { allowed: false; downloadUrl: string };

function onVersionCheckResult(
  callback: (result: VersionCheckResult) => void,
): void {
  ipcRenderer.on("version-check-result", (_event, result: VersionCheckResult) =>
    callback(result),
  );
}

contextBridge.exposeInMainWorld("lcu", {
  getConfig,
  openFolderDialog,
  useDetected,
  getClientStatus: clientStatus,
  runSync: syncResult,
  windowMinimize,
  windowMaximizeToggle,
  windowClose,
  onWindowMaximizedChanged,
  onVersionCheckResult,
});
