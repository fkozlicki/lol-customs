import { Progress } from "@v1/ui/progress";

interface MatchStatsProps {
  blueTeamKills: number;
  redTeamKills: number;
  blueGold: number;
  totalGold: number;
}

export function MatchStats({
  blueTeamKills,
  redTeamKills,
  blueGold,
  totalGold,
}: MatchStatsProps) {
  return (
    <div className="flex-1 space-y-1">
      <div className="relative">
        <div className="absolute top-0 left-0 bottom-0 right-0 z-10 flex justify-between text-[11px] text-white font-semibold px-1">
          <span>{blueTeamKills}</span>
          <span>Total Kills</span>
          <span>{redTeamKills}</span>
        </div>
        <Progress
          value={(blueTeamKills / (blueTeamKills + redTeamKills)) * 100}
          className="w-full h-4 rounded-none [&>div]:bg-red-400 bg-blue-400"
        />
      </div>
      <div className="relative">
        <div className="absolute top-0 left-0 bottom-0 right-0 z-10 flex justify-between text-[11px] text-white font-semibold px-1">
          <span>{blueGold}</span>
          <span>Total Gold</span>
          <span>{totalGold}</span>
        </div>
        <Progress
          value={(blueGold / totalGold) * 100}
          className="w-full h-4 rounded-none [&>div]:bg-red-400 bg-blue-400"
        />
      </div>
    </div>
  );
}
