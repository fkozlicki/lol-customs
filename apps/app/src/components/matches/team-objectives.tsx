import { cn } from "@v1/ui/cn";
import Image from "next/image";
import { objectiveIconUrl } from "@/utils/asset-urls";

interface TeamObjectivesProps {
  baronKills: number;
  dragonKills: number;
  heraldKills: number;
  inhibitorKills: number;
  towerKills: number;
  teamName: "blue" | "red";
  align?: "left" | "right";
}

export function TeamObjectives({
  baronKills,
  dragonKills,
  heraldKills,
  inhibitorKills,
  towerKills,
  teamName,
  align = "left",
}: TeamObjectivesProps) {
  return (
    <div className="flex items-center gap-2 justify-center sm:block sm:space-y-1">
      <div className={cn("flex gap-2", align === "right" && "justify-end")}>
        <div className="flex items-center gap-1.5 text-xs">
          <Image
            src={objectiveIconUrl("baron", teamName)}
            alt=""
            width={16}
            height={16}
            className="shrink-0"
          />
          {baronKills}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Image
            src={objectiveIconUrl("dragon", teamName)}
            alt=""
            width={16}
            height={16}
            className="shrink-0"
          />
          {dragonKills}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Image
            src={objectiveIconUrl("herald", teamName)}
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
            src={objectiveIconUrl("inhibitor", teamName)}
            alt=""
            width={16}
            height={16}
            className="shrink-0"
          />
          {inhibitorKills}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Image
            src={objectiveIconUrl("tower", teamName)}
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
