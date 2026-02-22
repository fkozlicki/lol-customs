"use client";

import type { RouterOutputs } from "@v1/api";
import { Button } from "@v1/ui/button";
import { Card, CardContent, CardHeader } from "@v1/ui/card";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { useState } from "react";
import { ProfileIcon } from "@/components/game-assets/profile-icon";
import { useScopedI18n } from "@/locales/client";
import { PartnerRow } from "./partner-row";

type PlayerSquadEntry = RouterOutputs["duos"]["duosPerPlayer"][number];
type PartnerEntry = {
  puuid: string;
  player: PlayerSquadEntry["player"];
  count: number;
};

function displayName(player: PlayerSquadEntry["player"]): string {
  if (player?.game_name != null && player?.tag_line != null) {
    return `${player.game_name} #${player.tag_line}`;
  }
  return player?.game_name ?? "—";
}

interface PlayerSquadCardProps {
  entry: PlayerSquadEntry;
}

function CollapsiblePartnerList({
  items,
  title,
  noDataYet,
}: {
  items: PartnerEntry[];
  title: string;
  noDataYet: string;
}) {
  const t = useScopedI18n("dashboard.pages.duos");
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 1);
  const hasMore = items.length > 1;
  const hiddenCount = items.length - 1;
  const showMore = t("showMore");
  const showLess = t("showLess");

  return (
    <section className="space-y-1">
      <div className="flex items-center justify-between">
        <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {title}
        </h3>
        {hasMore && (
          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground h-auto px-0 text-xs font-normal"
            onClick={() => setExpanded((e) => !e)}
          >
            <Icons.ChevronDown
              className={cn(
                "size-3.5 shrink-0 transition-transform",
                expanded && "rotate-180",
              )}
            />
            {expanded ? showLess : `${showMore} (${hiddenCount})`}
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{noDataYet}</p>
      ) : (
        visible.map((p) => <PartnerRow key={p.puuid} entry={p} />)
      )}
    </section>
  );
}

export function PlayerSquadCard({ entry }: PlayerSquadCardProps) {
  const t = useScopedI18n("dashboard.pages.duos");
  const name = displayName(entry.player);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <ProfileIcon
            iconId={entry.player?.profile_icon ?? null}
            name={name}
            avatarClassName="size-10 rounded-full"
            fallbackClassName="rounded-lg text-sm"
          />
          <p className="min-w-0 truncate font-semibold">{name}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <CollapsiblePartnerList
          items={entry.mostGamesWith}
          title={t("mostGamesWith")}
          noDataYet={t("noDataYet")}
        />
        <CollapsiblePartnerList
          items={entry.mostWinsWith}
          title={t("mostWinsWith")}
          noDataYet={t("noDataYet")}
        />
        <CollapsiblePartnerList
          items={entry.mostLossesWith}
          title={t("mostLossesWith")}
          noDataYet={t("noDataYet")}
        />
        <section className="space-y-1">
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {t("mostKilledPlayer")}
          </h3>
          {entry.mostKilled ? (
            <PartnerRow entry={entry.mostKilled} />
          ) : (
            <p className="text-muted-foreground text-sm">{t("noDataYet")}</p>
          )}
        </section>
        <section className="space-y-1">
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {t("mostlyKilledBy")}
          </h3>
          {entry.mostlyKilledBy ? (
            <PartnerRow entry={entry.mostlyKilledBy} />
          ) : (
            <p className="text-muted-foreground text-sm">{t("noDataYet")}</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
