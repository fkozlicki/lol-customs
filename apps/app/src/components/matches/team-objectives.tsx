import { cn } from "@v1/ui/cn";
import Image from "next/image";
import {
  type Objective,
  objectiveIconUrl,
  type Side,
} from "@/utils/asset-urls";

interface TeamObjectivesProps {
  baronKills: number;
  dragonKills: number;
  heraldKills: number;
  inhibitorKills: number;
  towerKills: number;
  teamName: Side;
  align?: "left" | "right";
}

/** Two rows, in the order the client's end-of-game screen lists them. */
const ROWS: readonly (readonly Objective[])[] = [
  ["baron", "dragon", "herald"],
  ["inhibitor", "tower"],
];

export function TeamObjectives({
  baronKills,
  dragonKills,
  heraldKills,
  inhibitorKills,
  towerKills,
  teamName,
  align = "left",
}: TeamObjectivesProps) {
  const counts: Record<Objective, number> = {
    baron: baronKills,
    dragon: dragonKills,
    herald: heraldKills,
    inhibitor: inhibitorKills,
    tower: towerKills,
  };

  return (
    <div className="flex items-center gap-2 justify-center sm:block sm:space-y-1">
      {ROWS.map((row) => (
        <div
          key={row.join()}
          className={cn("flex gap-2", align === "right" && "justify-end")}
        >
          {row.map((objective) => (
            <div key={objective} className="flex items-center gap-1.5 text-xs">
              <Image
                src={objectiveIconUrl(objective, teamName)}
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              <span className="num">{counts[objective]}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
