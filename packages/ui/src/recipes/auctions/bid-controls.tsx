"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "../../components/button";
import { Input } from "../../components/input";

interface BidControlsProps {
  /** The least a bid may be: one more than the current price. */
  minimumBid: number;
  /** The viewer's budget left, the most a bid may be. */
  budget: number;
  canBid: boolean;
  canConcede: boolean;
  /** A bid or concession is on its way. */
  busy: boolean;
  onBid: (amount: number) => void;
  onConcede: () => void;
}

/**
 * A captain's controls while bidding: an amount of their choosing, +1, all-in, or conceding. Key it
 * by the player on sale, so the amount starts from the minimum every round.
 */
export function BidControls({
  minimumBid,
  budget,
  canBid,
  canConcede,
  busy,
  onBid,
  onConcede,
}: BidControlsProps) {
  const t = useTranslations("auctions");
  const [amount, setAmount] = useState(minimumBid);
  // Keep a higher bid the captain typed, as long as it is still allowed, rather than snapping back.
  useEffect(() => {
    setAmount((current) =>
      current < minimumBid ? minimumBid : Math.min(current, budget),
    );
  }, [minimumBid, budget]);
  const shown = Number.isNaN(amount) ? "" : amount;

  return (
    <div className="space-y-3 border-t pt-6">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex gap-2">
          <Input
            type="number"
            min={minimumBid}
            max={budget}
            value={shown}
            onChange={(event) => setAmount(event.target.valueAsNumber)}
            aria-label={t("actions.customBid")}
            className="num h-11 w-24 text-lg"
          />
          <Button
            size="lg"
            className="flex-1"
            disabled={!canBid || busy || amount < minimumBid || amount > budget}
            onClick={() => onBid(amount)}
          >
            {t("actions.bid")} ${shown}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            size="lg"
            variant="outline"
            disabled={!canBid || busy}
            onClick={() => onBid(minimumBid)}
          >
            +1
          </Button>
          <Button
            size="lg"
            variant="outline"
            disabled={!canBid || busy}
            onClick={() => onBid(budget)}
          >
            {t("actions.allIn")}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            disabled={!canConcede || busy}
            onClick={onConcede}
          >
            {t("actions.concede")}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("room.concedeHint")}</p>
    </div>
  );
}
