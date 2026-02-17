export type VersionCheckResult =
  | { allowed: true }
  | { allowed: false; downloadUrl: string };

export type GameForUi = {
  gameId: number;
  gameCreation?: number;
  duration?: number;
  queueId: number;
  isSaved: boolean;
};

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
      fetchGames: () => Promise<
        | { success: true; games: GameForUi[] }
        | { success: false; error: string; games: [] }
      >;
      saveSelectedMatches: (gameIds: number[]) => Promise<{
        success: boolean;
        message: string;
        savedCount?: number;
        errorCount?: number;
        errors?: string[];
      }>;
      windowMinimize?: () => void;
      windowMaximizeToggle?: () => void;
      windowClose?: () => void;
      onWindowMaximizedChanged?: (cb: (maximized: boolean) => void) => void;
      onVersionCheckResult?: (cb: (result: VersionCheckResult) => void) => void;
    };
  }
}
