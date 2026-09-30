"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";

interface FreeAuctionControlsProps {
  /** The viewer still has budget, so the choice is theirs; otherwise they wait for it. */
  canDecide: boolean;
  busy: boolean;
  onTake: () => void;
  onPass: () => void;
}

/** When one captain is out of budget: the other takes the player for $1 or passes them over free. */
export function FreeAuctionControls({
  canDecide,
  busy,
  onTake,
  onPass,
}: FreeAuctionControlsProps) {
  const t = useTranslations("auctions");

  return (
    <div className="space-y-3 border-t pt-6">
      {canDecide ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button size="lg" disabled={busy} onClick={onTake}>
              {t("actions.takeForOne")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={busy}
              onClick={onPass}
            >
              {t("actions.pass")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("room.freeAuctionHint")}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("room.iAmBroke")}</p>
      )}
    </div>
  );
}
