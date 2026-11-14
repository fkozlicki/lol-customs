import "server-only";
import type { Client } from "../types";

/** Ladder seasons, oldest first. `starts_at` is null for the open-ended first season. */
export async function listSeasons(client: Client) {
  const { data, error } = await client
    .from("seasons")
    .select("id, number, starts_at")
    .order("starts_at", { ascending: true });
  if (error) throw error;

  const now = Date.now();
  const seasons = data.map((s) => {
    const startsAt = new Date(s.starts_at);
    return {
      id: s.id,
      number: s.number,
      starts_at: Number.isNaN(startsAt.getTime())
        ? null
        : startsAt.toISOString(),
    };
  });
  const current = [...seasons]
    .reverse()
    .find(
      (s) => s.starts_at === null || new Date(s.starts_at).getTime() <= now,
    );

  return seasons.map((s) => ({ ...s, isCurrent: s.id === current?.id }));
}
