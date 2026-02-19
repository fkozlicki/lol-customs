import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import Image from "next/image";
import type { MatchParticipant } from "./match-card";
import type { ChampionMap } from "./match-detail";

const DD_CDN = "https://ddragon.leagueoflegends.com/cdn";

export default function MatchTeam({
  teamName,
  team,
  championMap,
  patch,
}: {
  team: MatchParticipant[];
  championMap: ChampionMap;
  patch: string;
  teamName: "red" | "blue";
}) {
  const isVictorious = team[0]?.win === true;

  return (
    <div className="flex flex-col gap-0.5 shrink-0">
      <div className="flex items-center gap-1">
        <span
          className={cn(
            "text-[10px] font-semibold uppercase",
            teamName === "blue" ? "text-blue-500" : "text-red-500",
          )}
        >
          {teamName}
        </span>

        <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium uppercase inline-flex items-center gap-0.5">
          {isVictorious && <Icons.Trophy className="size-3 text-amber-500" />}
          {isVictorious ? "Winners" : "Losers"}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        {team.map((p) => {
          const ch =
            p.champion_id != null ? championMap[String(p.champion_id)] : null;
          return (
            <div
              key={p.puuid}
              className="flex items-center gap-1.5 truncate max-w-[140px]"
            >
              {ch ? (
                <Image
                  src={`${DD_CDN}/${patch}/img/champion/${ch.imageFull}`}
                  alt=""
                  width={16}
                  height={16}
                  className="rounded-sm shrink-0 object-cover"
                />
              ) : (
                <div className="h-5 w-5 rounded-full bg-muted shrink-0" />
              )}
              <span className="truncate text-xs max-w-[80px]">
                {p.players.game_name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
