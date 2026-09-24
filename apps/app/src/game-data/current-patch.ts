import { GENERATED_PATCH } from "./champions";

/**
 * The latest Data Dragon patch, fetched once on the server and cached by Next for an hour.
 *
 * Item and spell images are addressed by patch, and a new item only exists from the patch that
 * added it, so images use the live patch rather than the one `champions.ts` was generated from.
 * If Data Dragon is down, that generated patch stands in: images keep working, only the newest
 * items go missing.
 */
export async function currentPatch(): Promise<string> {
  try {
    const response = await fetch(
      "https://ddragon.leagueoflegends.com/api/versions.json",
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return GENERATED_PATCH;
    const [latest] = (await response.json()) as unknown[];
    return typeof latest === "string" ? latest : GENERATED_PATCH;
  } catch {
    return GENERATED_PATCH;
  }
}
