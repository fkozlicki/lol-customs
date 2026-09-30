import { CHAMPIONS, GENERATED_PATCH } from "./champions.generated";

export { GENERATED_PATCH };

/** A champion as the art needs it. */
export interface Champion {
  name: string;
  /** The square portrait's file on Data Dragon: `MonkeyKing.png` for Wukong. */
  imageFile: string;
  /** Data Dragon's id, the file without `.png`, which names the loading-screen art. */
  dataDragonId: string;
}

function toChampion({
  name,
  image,
}: {
  name: string;
  image: string;
}): Champion {
  return { name, imageFile: image, dataDragonId: image.replace(/\.png$/, "") };
}

/**
 * The champion behind the numeric id match data carries, or null for one released since the list was
 * generated — the art shows a placeholder until `bun generate:game-data` runs again.
 */
export function champion(id: number | null | undefined): Champion | null {
  const found = id != null ? CHAMPIONS[id] : undefined;
  return found ? toChampion(found) : null;
}

/** Every champion in the generated list. */
export function allChampions(): Champion[] {
  return Object.values(CHAMPIONS).map(toChampion);
}
