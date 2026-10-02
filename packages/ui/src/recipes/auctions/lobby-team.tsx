"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";
import { Icons } from "../../components/icons";
import { cn } from "../../utils/cn";
import type { LobbyTeamView } from "./auction-room-view";
import { TeamNameEditor } from "./team-name-editor";

export interface LobbyTeamProps {
  team: LobbyTeamView;
  /** The viewer is renaming this team. */
  renaming: boolean;
  busy: { seat: boolean; rename: boolean; join: boolean };
  onRenameStart: () => void;
  onRenameSave: (name: string) => void;
  onRenameCancel: () => void;
  onSeatAction: () => void;
  onJoin: () => void;
  onCopyInvite: () => void;
}

/** A team waiting in the lobby: its name, its captain and whether they are ready, or the open seat. */
export function LobbyTeam({
  team,
  renaming,
  busy,
  onRenameStart,
  onRenameSave,
  onRenameCancel,
  onSeatAction,
  onJoin,
  onCopyInvite,
}: LobbyTeamProps) {
  const t = useTranslations("auctions");
  const { captain } = team;
  const link =
    "label-caps underline-offset-4 hover:text-foreground hover:underline";

  return (
    <div className="space-y-3 border-b pb-6">
      {renaming && captain ? (
        <TeamNameEditor
          initialName={team.teamName ?? ""}
          saving={busy.rename}
          onSave={onRenameSave}
          onCancel={onRenameCancel}
        />
      ) : (
        <h2 className="truncate text-xl font-semibold uppercase tracking-[-0.02em] sm:text-2xl">
          {team.teamName ?? t(`room.team${team.side}`)}
        </h2>
      )}
      {captain ? (
        <>
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Icons.Captain className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{captain.name}</span>
          </p>
          <div className="flex items-baseline gap-4">
            <span
              className={cn("label-caps", captain.ready && "text-foreground")}
            >
              {captain.ready ? t("lobby.ready") : t("lobby.notReady")}
            </span>
            {team.canRename && !renaming && (
              <button type="button" onClick={onRenameStart} className={link}>
                {t("lobby.rename")}
              </button>
            )}
            {team.seatAction && (
              <button
                type="button"
                disabled={busy.seat}
                onClick={onSeatAction}
                className={link}
              >
                {team.seatAction === "leave"
                  ? t("lobby.leave")
                  : t("lobby.remove")}
              </button>
            )}
          </div>
        </>
      ) : team.vacancy === "join" ? (
        <Button className="self-start" disabled={busy.join} onClick={onJoin}>
          {t("actions.join")}
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {team.vacancy === "invite"
              ? t("lobby.waitingForCaptain")
              : t("lobby.openSlot")}
          </span>
          {team.vacancy === "invite" && (
            <Button size="sm" onClick={onCopyInvite}>
              <Icons.Copy className="size-4" />
              {t("lobby.copyLink")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
