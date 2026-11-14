import Link from "next/link";
import type { HallOfFamePlayerView } from "./hall-of-fame-view";

/** A title holder's name, linked to their profile. */
export function HallOfFamePlayerLink({
  player,
}: {
  player: HallOfFamePlayerView;
}) {
  return (
    <Link href={player.href} className="underline-offset-4 hover:underline">
      {player.name}
    </Link>
  );
}
