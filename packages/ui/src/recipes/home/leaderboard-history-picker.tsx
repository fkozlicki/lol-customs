"use client";

import { useTranslations } from "next-intl";
import { ScrollArea, ScrollBar } from "../../components/scroll-area";
import { cn } from "../../utils/cn";

interface LeaderboardHistoryPickerProps {
  /** The match counts the standings can be replayed after, in order; live comes last. */
  options: number[];
  /** The chosen count; null is live. */
  value: number | null;
  onChange: (value: number | null) => void;
  className?: string;
}

/** Replays the standings as they stood after N matches, or shows them live. */
export default function LeaderboardHistoryPicker({
  options,
  value,
  onChange,
  className,
}: LeaderboardHistoryPickerProps) {
  const t = useTranslations("standings");

  if (options.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="label-caps shrink-0">{t("historyLabel")}</span>
      <div className="flex min-w-0 flex-1 items-stretch border">
        <ScrollArea className="min-w-0 flex-1">
          <div className="flex">
            {options.map((gameCount) => (
              <PickerButton
                key={gameCount}
                active={value === gameCount}
                onClick={() => onChange(gameCount)}
              >
                {gameCount}
              </PickerButton>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <PickerButton active={value == null} onClick={() => onChange(null)}>
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
