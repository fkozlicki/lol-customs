import Image from "next/image";
import type { MatchParticipant } from "./match-card";
import type { ChampionMap } from "./match-detail";
import type { RawParticipant } from "./match-table";

interface MatchParticipantInfoProps {
  p: MatchParticipant;
  ch: ChampionMap[string] | null | undefined;
  patch: string;
  rawData: RawParticipant | undefined;
}

const DD_CDN = "https://ddragon.leagueoflegends.com/cdn";
const RANK_CRESTS_BASE =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/";

const SPELL_ID_TO_KEY: Record<number, string> = {
  1: "SummonerBoost",
  3: "SummonerExhaust",
  4: "SummonerFlash",
  6: "SummonerHaste",
  7: "SummonerHeal",
  11: "SummonerSmite",
  12: "SummonerTeleport",
  14: "SummonerDot",
  21: "SummonerBarrier",
  30: "SummonerPoroRecall",
  31: "SummonerPoroThrow",
  32: "SummonerSnowball",
  39: "SummonerSnowURFSnowball_Mark",
  54: "Summoner_UltBookPlaceholder",
  55: "Summoner_UltBookSmitePlaceholder",
};

function getSpellIconUrl(spellId: number, patch: string): string {
  const key = SPELL_ID_TO_KEY[spellId] ?? "SummonerFlash";
  return `${DD_CDN}/${patch}/img/spell/${key}.png`;
}

const RANK_TIERS = new Set([
  "iron",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "emerald",
  "diamond",
  "master",
  "grandmaster",
  "challenger",
]);

function getRankIconUrl(rank_tier: string | null): string {
  if (!rank_tier?.trim()) return `${RANK_CRESTS_BASE}unranked.svg`;
  const tier = rank_tier.toLowerCase();
  return RANK_TIERS.has(tier)
    ? `${RANK_CRESTS_BASE}${tier}.svg`
    : `${RANK_CRESTS_BASE}unranked.svg`;
}

export default function MatchParticipantInfo({
  p,
  patch,
  ch,
  rawData,
}: MatchParticipantInfoProps) {
  return (
    <div className="flex items-center gap-1">
      {ch && (
        <div className="relative">
          <Image
            src={`${DD_CDN}/${patch}/img/champion/${ch.imageFull}`}
            alt=""
            width={32}
            height={32}
            className="rounded-full shrink-0"
          />
          <div className="absolute bottom-0 right-0 text-[10px] size-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
            {p.champ_level}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        {rawData?.spell1Id != null && rawData.spell1Id !== 0 && (
          <Image
            src={getSpellIconUrl(rawData.spell1Id, patch)}
            alt=""
            width={16}
            height={16}
            className="rounded-sm"
          />
        )}
        {rawData?.spell2Id != null && rawData.spell2Id !== 0 && (
          <Image
            src={getSpellIconUrl(rawData.spell2Id, patch)}
            alt=""
            width={16}
            height={16}
            className="rounded-sm"
          />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-muted-foreground text-xs max-w-[90px] truncate">
          {p.players.game_name}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
          <Image
            src={getRankIconUrl(p.rank_tier)}
            alt=""
            width={14}
            height={14}
            className="shrink-0"
          />
          {p.rank_tier?.toLowerCase() ?? "Unranked"} {p.rank_division ?? ""}
        </span>
      </div>
    </div>
  );
}
