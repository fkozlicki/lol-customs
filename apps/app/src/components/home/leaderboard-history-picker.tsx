"use client";

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

  if (gameOptions.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="label-caps shrink-0">{t("historyLabel")}</span>
      <div className="flex min-w-0 flex-1 items-stretch border">
        <ScrollArea className="min-w-0 flex-1">
          <div className="flex">
            {gameOptions.map((gameCount) => (
              <PickerButton
                key={gameCount}
                active={after === gameCount}
                onClick={() => setAfter(gameCount)}
              >
                {gameCount}
              </PickerButton>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <PickerButton active={!after} onClick={() => setAfter(null)}>
          {t("historyLive")}
        </PickerButton>
      </div>
    </div>
  );
}

function PickerButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "num h-8 min-w-10 shrink-0 border-r px-2 text-xs uppercase transition-colors last:border-r-0",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
