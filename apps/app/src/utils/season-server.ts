import { getQueryClient, trpc } from "@/trpc/server";
import { resolveSeason } from "./season";

/** Resolves `?season=` on the server and primes the seasons list for hydration. */
export async function getSeasonScope(raw: string | undefined) {
  const seasons = await getQueryClient().fetchQuery(
    trpc.seasons.list.queryOptions(),
  );
  return { season: resolveSeason(raw, seasons), seasons };
}
