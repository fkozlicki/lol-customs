import { GENERATED_PATCH } from "./champions.generated";

export const VERSIONS_URL =
  "https://ddragon.leagueoflegends.com/api/versions.json";

interface LatestPatchOptions {
  /** Passed to `fetch`: the app adds Next's revalidation here. */
  init?: RequestInit;
  /** The `fetch` to call; tests pass their own. */
  fetch?: (input: string, init?: RequestInit) => Promise<Response>;
}

/**
 * The patch game assets are drawn from: the latest Data Dragon has published.
 *
 * Item and spell art is addressed by patch, and a new item exists only from the patch that added it,
 * so the art follows the live patch rather than the one the champion list was generated from. When Data
 * Dragon cannot be reached, or answers with anything but a list of versions, that generated patch stands
 * in: it is always a real one, so images keep working and only the newest items go missing.
 */
export async function latestPatch({
  init,
  fetch = (input, requestInit) => globalThis.fetch(input, requestInit),
}: LatestPatchOptions = {}): Promise<string> {
  try {
    const response = await fetch(VERSIONS_URL, init);
    if (!response.ok) return GENERATED_PATCH;
    const versions: unknown = await response.json();
    const latest = Array.isArray(versions) ? versions[0] : undefined;
    return typeof latest === "string" ? latest : GENERATED_PATCH;
  } catch {
    return GENERATED_PATCH;
  }
}
