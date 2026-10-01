import { ItemImage } from "../game-assets/item-image";

/** Six items and the trinket; an empty slot keeps its square. */
export default function MatchParticipantItems({
  itemIds,
}: {
  itemIds: (number | null)[];
}) {
  return (
    <div className="flex items-center gap-0.5">
      {itemIds.map((itemId, index) => (
        <ItemImage
          key={`${index}-${itemId}`}
          itemId={itemId}
          width={22}
          height={22}
        />
      ))}
    </div>
  );
}
