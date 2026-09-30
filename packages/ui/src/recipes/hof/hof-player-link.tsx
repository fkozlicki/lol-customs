import Link from "next/link";
import type { HofPlayerView } from "./hall-of-fame-view";

/** A title holder's name, linked to their profile. */
export function HofPlayerLink({ player }: { player: HofPlayerView }) {
  return (
    <Link href={player.href} className="underline-offset-4 hover:underline">
      {player.name}
    </Link>
  );
}
