declare global {
  interface Window {
    lcu?: {
      getConfig: () => Promise<{
        lolDirectory: string | null;
        detected: string | null;
        effectiveDirectory: string | null;
        available: boolean;
      }>;
      openFolderDialog: () => Promise<
        { success: true; path: string } | { success: false; error: string }
      >;
      runSync: () => Promise<{
        success: boolean;
        message: string;
        savedCount?: number;
        skippedCount?: number;
      }>;
      windowMinimize?: () => void;
      windowMaximizeToggle?: () => void;
      windowClose?: () => void;
      onWindowMaximizedChanged?: (cb: (maximized: boolean) => void) => void;
    };
  }
}

export {};
