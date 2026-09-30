"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/dropdown-menu";
import { Icons } from "../icons";

export interface SeasonOptionView {
  /** What the app puts in `?season=`. */
  value: string;
  seasonNumber: number;
  isCurrent: boolean;
}

interface SeasonSelectorProps {
  /** Every season, oldest first; the menu lists them newest first. */
  seasons: SeasonOptionView[];
  /** The value that means all seasons. */
  allSeasonsValue: string;
  value: string;
  onChange: (value: string) => void;
}

/** Which rating track the season-scoped pages show: one season, or all of them. */
export function SeasonSelector({
  seasons,
  allSeasonsValue,
  value,
  onChange,
}: SeasonSelectorProps) {
  const t = useTranslations("season");
  const selected = seasons.find((season) => season.value === value);
  const label = selected
    ? t("label", { number: selected.seasonNumber })
    : t("allTime");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em]"
        >
          {label}
          <Icons.ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {[...seasons].reverse().map((season) => (
            <DropdownMenuRadioItem key={season.value} value={season.value}>
              {t("label", { number: season.seasonNumber })}
              {season.isCurrent && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {t("current")}
                </span>
              )}
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuRadioItem value={allSeasonsValue}>
            {t("allTime")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
