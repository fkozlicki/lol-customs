"use client";

import { useTranslations } from "next-intl";

interface LobbyChangeNoticeProps {
  /** The viewer created the lobby (it is cancelled) or joined it (they leave it). */
  kind: "replaces" | "leaves";
  teamA: string;
  teamB: string;
}

/** A person captains one lobby at a time: say what creating another does to the one they are in. */
export function LobbyChangeNotice({
  kind,
  teamA,
  teamB,
}: LobbyChangeNoticeProps) {
  const t = useTranslations("auctions.creator");

  return (
    <p className="border-b pb-4 text-sm text-muted-foreground">
      {kind === "replaces"
        ? t("replacesLobby", { teamA, teamB })
        : t("leavesLobby", { teamA, teamB })}
    </p>
  );
}
