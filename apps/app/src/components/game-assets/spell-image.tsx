"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useTRPC } from "@/trpc/react";
import { spellImageUrl } from "@/utils/asset-urls";

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

interface SpellImageProps {
  spellId: number;
  width: number;
  height: number;
  className?: string;
}

export function SpellImage({
  spellId,
  width,
  height,
  className,
}: SpellImageProps) {
  const trpc = useTRPC();
  const { data: patch } = useSuspenseQuery(
    trpc.datadragon.currentPatch.queryOptions(),
  );

  const key = SPELL_ID_TO_KEY[spellId] ?? "SummonerFlash";

  return (
    <Image
      src={spellImageUrl(patch, `${key}.png`)}
      alt=""
      width={width}
      height={height}
      className={className}
    />
  );
}
