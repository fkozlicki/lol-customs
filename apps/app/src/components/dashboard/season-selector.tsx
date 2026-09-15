"use client";

import { useQuery } from "@tanstack/react-query";
import { ALL_TIME_SEASON } from "@v1/api/season";
import { Button } from "@v1/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@v1/ui/dropdown-menu";
import { Icons } from "@v1/ui/icons";
import { usePathname } from "next/navigation";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import {
  isSeasonScopedPath,
  resolveSeason,
  SEASON_PARAM,
  seasonNumber,
  seasonToParam,
} from "@/utils/season";

export function SeasonSelector() {
  const t = useScopedI18n("dashboard.season");
  const trpc = useTRPC();
  const pathname = usePathname();
  const { data: seasons } = useQuery(trpc.seasons.list.queryOptions());
  const [params, setParams] = useQueryStates(
    { [SEASON_PARAM]: parseAsString, after: parseAsInteger },
    { shallow: false },
  );

  if (!seasons?.length || !isSeasonScopedPath(pathname)) return null;

  const season = resolveSeason(params[SEASON_PARAM], seasons);
  const label =
    season === ALL_TIME_SEASON
      ? t("allTime")
      : t("label", { number: seasonNumber(season, seasons) ?? season });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Icons.Calendar className="size-3.5" />
          {label}
          <Icons.ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup
          value={seasonToParam(season)}
          onValueChange={(value) =>
            setParams({ [SEASON_PARAM]: value, after: null })
          }
        >
          {[...seasons].reverse().map((s) => (
            <DropdownMenuRadioItem key={s.id} value={seasonToParam(s.id)}>
              {t("label", { number: s.number })}
              {s.isCurrent && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {t("current")}
                </span>
              )}
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuRadioItem value={seasonToParam(ALL_TIME_SEASON)}>
            {t("allTime")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
