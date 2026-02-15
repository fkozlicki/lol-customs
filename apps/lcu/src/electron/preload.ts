import { contextBridge, ipcRenderer } from "electron";

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

contextBridge.exposeInMainWorld("lcu", {
  getConfig,
  openFolderDialog,
  useDetected,
  getClientStatus: clientStatus,
  runSync: syncResult,
});
