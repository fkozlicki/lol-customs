import { notFound } from "next/navigation";
import { MostPlayedChampions } from "@/components/player/most-played-champions";
import { PlayerMatchHistory } from "@/components/player/player-match-history";
import { PlayerProfileHeader } from "@/components/player/player-profile-header";
import { PlayerRankCard } from "@/components/player/player-rank-card";
import { PlayerStatsCard } from "@/components/player/player-stats-card";
import { RatingHistoryChart } from "@/components/player/rating-history-chart";
import { caller, HydrateClient, prefetch, trpc } from "@/trpc/server";

interface PlayerPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

function parseSlug(slug: string): { gameName: string; tagLine: string } {
  const decoded = decodeURIComponent(slug);
  const lastDash = decoded.lastIndexOf("-");
  if (lastDash === -1) return { gameName: decoded, tagLine: "" };
  return {
    gameName: decoded.slice(0, lastDash),
    tagLine: decoded.slice(lastDash + 1),
  };
}

export default async function PlayerProfilePage({ params }: PlayerPageProps) {
  const { slug } = await params;
  const { gameName, tagLine } = parseSlug(slug);

  const player = await caller.players.getByRiotId({ gameName, tagLine });

  if (!player) notFound();

  const puuid = player.puuid;
  const platformId = player.platform_id ?? "eun1";

  prefetch(trpc.players.profileStats.queryOptions({ puuid }));
  prefetch(trpc.players.ratingHistory.queryOptions({ puuid }));
  prefetch(trpc.players.mostPlayedChampions.queryOptions({ puuid, limit: 5 }));
  prefetch(
    trpc.matches.listByPuuid.infiniteQueryOptions(
      { puuid, limit: 10 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
    ),
  );
  prefetch(
    trpc.riot.getPlayerRankByRiotId.queryOptions({
      gameName,
      tagLine,
      platformId,
    }),
  );
  prefetch(trpc.datadragon.currentPatch.queryOptions());
  prefetch(trpc.datadragon.championMap.queryOptions());

  return (
    <HydrateClient>
      <PlayerProfileHeader
        puuid={puuid}
        gameName={gameName}
        tagLine={tagLine}
      />
      <div className="bg-secondary">
        <div className="flex p-6 gap-2 max-w-6xl mx-auto w-full flex-col xl:flex-row">
          <div className="xl:max-w-[330px] flex flex-col gap-2 flex-1">
            <PlayerRankCard
              gameName={gameName}
              tagLine={tagLine}
              platformId={platformId}
            />

            <PlayerStatsCard puuid={puuid} />

            <RatingHistoryChart puuid={puuid} />

            <MostPlayedChampions puuid={puuid} />
          </div>
          <div className="flex-1">
            <PlayerMatchHistory puuid={puuid} />
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
