import Image from "next/image";
import type { RawParticipant } from "./match-table";

interface MatchParticipantItemsProps {
  rawData: RawParticipant | undefined;
  patch: string;
}

const DD_CDN = "https://ddragon.leagueoflegends.com/cdn";

export default function MatchParticipantItems({
  rawData,
  patch,
}: MatchParticipantItemsProps) {
  return (
    <div className="flex gap-0.5 items-center">
      {[
        rawData?.stats.item0,
        rawData?.stats.item1,
        rawData?.stats.item2,
        rawData?.stats.item3,
        rawData?.stats.item4,
        rawData?.stats.item5,
        rawData?.stats.item6,
      ].map((itemId, index) =>
        itemId ? (
          <Image
            key={`${index}-${itemId}`}
            src={`${DD_CDN}/${patch}/img/item/${itemId}.png`}
            alt=""
            width={22}
            height={22}
            className="rounded-sm"
          />
        ) : (
          <div
            key={`${index}-${itemId}`}
            className="size-6 bg-muted rounded-sm"
          />
        ),
      )}
    </div>
  );
}
