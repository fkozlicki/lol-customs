import { ItemImage } from "@/components/game-assets/item-image";
import type { RawParticipant } from "./match-history-list";

interface MatchParticipantItemsProps {
  rawData: RawParticipant | undefined;
}

export default function MatchParticipantItems({
  rawData,
}: MatchParticipantItemsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[
        rawData?.stats.item0,
        rawData?.stats.item1,
        rawData?.stats.item2,
        rawData?.stats.item3,
        rawData?.stats.item4,
        rawData?.stats.item5,
        rawData?.stats.item6,
      ].map((itemId, index) => (
        <ItemImage
          key={`${index}-${itemId}`}
          itemId={itemId ?? null}
          width={22}
          height={22}
        />
      ))}
    </div>
  );
}
