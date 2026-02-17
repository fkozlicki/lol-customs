export type VersionCheckResult =
  | { allowed: true }
  | { allowed: false; downloadUrl: string };

/** Match list item: full match data from LCU + saved flag. */
export interface GameForUi {
  match: {
    gameId: number;
    gameCreation?: number;
    gameDuration?: number;
    participants: Array<{
      participantId: number;
      championId: number;
      spell1Id: number;
      spell2Id: number;
      stats: {
        champLevel: number;
        kills: number;
        deaths: number;
        assists: number;
        goldEarned: number;
        totalMinionsKilled?: number;
        neutralMinionsKilled?: number;
        win: boolean;
        perkPrimaryStyle?: number;
        perk0?: number;
        item0?: number;
        item1?: number;
        item2?: number;
        item3?: number;
        item4?: number;
        item5?: number;
        item6?: number;
      };
    }>;
    participantIdentities: Array<{ participantId: number }>;
  };
  isSaved: boolean;
}

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
