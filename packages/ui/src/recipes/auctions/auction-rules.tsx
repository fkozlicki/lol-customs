"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "../../components/checkbox";
import { Input } from "../../components/input";
import { Label } from "../../components/label";
import type { AuctionSettings } from "./auction-settings";

interface AuctionRulesProps {
  settings: AuctionSettings;
  onChange: (settings: AuctionSettings) => void;
  /** Creating asks for the creator's team name; editing a lobby does not. */
  askTeamName: boolean;
}

/** A cleared number field reads as NaN; it shows as empty, and the form's check refuses it. */
const shown = (value: number) => (Number.isNaN(value) ? "" : value);

/** The room's rules: team name, budget, bid timer, and whether the draw order is public. */
export function AuctionRules({
  settings,
  onChange,
  askTeamName,
}: AuctionRulesProps) {
  const t = useTranslations("auctions.creator");
  const set = (changes: Partial<AuctionSettings>) =>
    onChange({ ...settings, ...changes });

  return (
    <section className="border-t pt-6">
      <h2 className="label-caps pb-3 text-foreground">{t("rules")}</h2>

      <div className="grid gap-6 sm:grid-cols-3">
        {askTeamName && (
          <div className="space-y-2">
            <Label htmlFor="auction-team-name" className="label-caps">
              {t("teamName")}
            </Label>
            <Input
              id="auction-team-name"
              value={settings.teamName}
              maxLength={100}
              onChange={(event) => set({ teamName: event.target.value })}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="auction-budget" className="label-caps">
            {t("budget")}
          </Label>
          <Input
            id="auction-budget"
            type="number"
            min={4}
            max={100}
            value={shown(settings.budget)}
            onChange={(event) => set({ budget: event.target.valueAsNumber })}
            className="num"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="auction-timer" className="label-caps">
            {t("timer")}
          </Label>
          <Input
            id="auction-timer"
            type="number"
            min={10}
            max={60}
            value={shown(settings.bidSeconds)}
            onChange={(event) =>
              set({ bidSeconds: event.target.valueAsNumber })
            }
            className="num"
          />
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3">
        <Checkbox
          id="auction-reveal-order"
          checked={settings.revealOrder}
          onCheckedChange={(checked) => set({ revealOrder: checked === true })}
        />
        <div className="grid gap-1.5">
          <Label htmlFor="auction-reveal-order">{t("revealOrder")}</Label>
          <p className="text-sm text-muted-foreground">
            {t("revealOrderHint")}
          </p>
        </div>
      </div>
    </section>
  );
}
