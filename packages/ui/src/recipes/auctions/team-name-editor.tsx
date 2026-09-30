"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "../../components/button";
import { Input } from "../../components/input";

interface TeamNameEditorProps {
  /** The name the field starts from. */
  initialName: string;
  saving: boolean;
  onSave: (name: string) => void;
  onCancel: () => void;
}

/** Renames a captain's team in place; Enter saves and Escape gives up. */
export function TeamNameEditor({
  initialName,
  saving,
  onSave,
  onCancel,
}: TeamNameEditorProps) {
  const t = useTranslations("auctions.lobby");
  const [name, setName] = useState(initialName);

  return (
    <div className="flex gap-2">
      <Input
        value={name}
        maxLength={100}
        autoFocus
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSave(name);
          if (event.key === "Escape") onCancel();
        }}
        aria-label={t("teamName")}
      />
      <Button disabled={!name.trim() || saving} onClick={() => onSave(name)}>
        {t("saveName")}
      </Button>
      <Button variant="ghost" onClick={onCancel}>
        {t("cancelEdit")}
      </Button>
    </div>
  );
}
