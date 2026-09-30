"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";
import { Input } from "../../components/input";

interface RiotIdFieldProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  /** The roster is full. */
  disabled: boolean;
}

/** Adds someone who is not on the ladder yet, by Riot ID. */
export function RiotIdField({
  value,
  onChange,
  onAdd,
  disabled,
}: RiotIdFieldProps) {
  const t = useTranslations("draw");

  return (
    <div className="space-y-2">
      <label htmlFor="draw-riot-id" className="label-caps">
        {t("riotIdLabel")}
      </label>
      <div className="flex items-center gap-2">
        <Input
          id="draw-riot-id"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("riotIdPlaceholder")}
          autoComplete="off"
        />
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          disabled={disabled}
        >
          {t("addPlayer")}
        </Button>
      </div>
    </div>
  );
}
