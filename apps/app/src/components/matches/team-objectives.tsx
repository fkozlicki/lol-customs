import { cn } from "@v1/ui/cn";
import Image from "next/image";

interface TeamObjectivesProps {
  baronKills: number;
  dragonKills: number;
  heraldKills: number;
  inhibitorKills: number;
  towerKills: number;
  teamName: "blue" | "red";
  align?: "left" | "right";
}

const MATCH_HISTORY_ICONS_BASE =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/";

const OBJECTIVE_ICONS = {
  baron: "baron-100.png",
  dragon: "dragon-100.png",
  herald: "herald-100.png",
  inhibitor: "inhibitor-100.png",
  tower: "tower-100.png",
} as const;

const OBJECTIVE_ICONS_RED = {
  baron: "baron-200.png",
  dragon: "dragon-200.png",
  herald: "herald-200.png",
  inhibitor: "inhibitor-200.png",
  tower: "tower-200.png",
} as const;

export function TeamObjectives({
  baronKills,
  dragonKills,
  heraldKills,
  inhibitorKills,
  towerKills,
  teamName,
  align = "left",
}: TeamObjectivesProps) {
  const objectiveIcons =
    teamName === "blue" ? OBJECTIVE_ICONS : OBJECTIVE_ICONS_RED;

  return (
    <div className="space-y-1">
      <div className={cn("flex gap-2", align === "right" && "justify-end")}>
        <div className="flex items-center gap-1.5 text-xs">
          <Image
            src={`${MATCH_HISTORY_ICONS_BASE}${objectiveIcons.baron}`}
            alt=""
            width={16}
            height={16}
            className="shrink-0"
          />
          {baronKills}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Image
            src={`${MATCH_HISTORY_ICONS_BASE}${objectiveIcons.dragon}`}
            alt=""
            width={16}
            height={16}
            className="shrink-0"
          />
          {dragonKills}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Image
            src={`${MATCH_HISTORY_ICONS_BASE}${objectiveIcons.herald}`}
            alt=""
            width={16}
            height={16}
            className="shrink-0"
          />
          {heraldKills}
        </div>
      </div>

      <div className={cn("flex gap-2", align === "right" && "justify-end")}>
        <div className="flex items-center gap-1.5 text-xs">
          <Image
            src={`${MATCH_HISTORY_ICONS_BASE}${objectiveIcons.inhibitor}`}
            alt=""
            width={16}
            height={16}
            className="shrink-0"
          />
          {inhibitorKills}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Image
            src={`${MATCH_HISTORY_ICONS_BASE}${objectiveIcons.tower}`}
            alt=""
            width={16}
            height={16}
            className="shrink-0"
          />
          {towerKills}
        </div>
      </div>
    </div>
  );
}
