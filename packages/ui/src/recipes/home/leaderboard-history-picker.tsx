"use client";

import { useTranslations } from "next-intl";
import { ScrollArea, ScrollBar } from "../../components/scroll-area";
import { cn } from "../../utils/cn";
import { HistoryPickerButton } from "./history-picker-button";

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
              <HistoryPickerButton
                key={gameCount}
                active={value === gameCount}
                onClick={() => onChange(gameCount)}
              >
                {gameCount}
              </HistoryPickerButton>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <HistoryPickerButton
          active={value == null}
          onClick={() => onChange(null)}
        >
          {t("historyLive")}
        </HistoryPickerButton>
      </div>
    </div>
  );
}
