"use client";

import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { ScrollArea, ScrollBar } from "@v1/ui/scroll-area";
import { parseAsInteger, useQueryState } from "nuqs";
import { useScopedI18n } from "@/locales/client";
import { maxHistoricallyAfterGames } from "./leaderboard-after-games";

interface LeaderboardHistoryPickerProps {
  /** Total ladder matches (rows in `matches`). Numbers are 1 … (n−1), then **live**. */
  gamesPlayed: number;
  className?: string;
}

export default function LeaderboardHistoryPicker({
  gamesPlayed,
  className,
}: LeaderboardHistoryPickerProps) {
  const t = useScopedI18n("dashboard.pages.leaderboard");

  const [after, setAfter] = useQueryState(
    "after",
    parseAsInteger.withOptions({
      shallow: false,
    }),
  );
  const numericMax = maxHistoricallyAfterGames(gamesPlayed);
  const gameOptions =
    numericMax > 0
      ? Array.from({ length: numericMax }, (_, index) => index + 1)
      : [];

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <div className="flex items-center">
        <ScrollArea className="overflow-x-auto">
          <div className="flex items-center">
            {gameOptions.map((gameCount) => (
              <Button
                key={gameCount}
                type="button"
                size="xl"
                variant={after === gameCount ? "default" : "outline"}
                onClick={() => setAfter(gameCount)}
                className="w-16 rounded-none border-0 border-r"
              >
                {gameCount}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <Button
          type="button"
          size="xl"
          variant={!after ? "default" : "outline"}
          onClick={() => setAfter(null)}
          className="w-16 rounded-none border-none"
        >
          {t("historyLive")}
        </Button>
      </div>
    </div>
  );
}
