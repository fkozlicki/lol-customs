import "server-only";
import type { Client } from "../types";
import { type PlayerRef, playerRef } from "./players";

/** The Hall of Fame of one rating track: each title's holders, with the value that earned it. */
export async function getHallOfFame(client: Client, track: number) {
  const { data: rows, error } = await client.rpc("hall_of_fame", {
    p_track: track,
  });
  if (error) throw error;

  const titles = new Map<string, { player: PlayerRef; value: number }[]>();
  for (const row of rows) {
    const entry = {
      player: playerRef(row.puuid, row),
      value: Number(row.value),
    };
    titles.set(row.title, [...(titles.get(row.title) ?? []), entry]);
  }
  return Object.fromEntries(titles);
}
