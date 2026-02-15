/**
 * Data Dragon: fetch and cache static game data (champions, items, spells, runes).
 * Uses in-memory cache with 1h TTL. No Next.js dependency.
 */

const DD_BASE = "https://ddragon.leagueoflegends.com";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// --- Raw response types from Data Dragon ---

interface DDChampionData {
  data: Record<
    string,
    {
      id: string;
      key: string;
      name: string;
      image: { full: string };
    }
  >;
  version: string;
}

interface DDItemData {
  data: Record<
    string,
    {
      name: string;
      image?: { full: string };
    }
  >;
  version: string;
}

interface DDSummonerData {
  data: Record<
    string,
    {
      id: string;
      key: string;
      name: string;
      image: { full: string };
    }
  >;
  version: string;
}

export interface ChampionInfo {
  id: string;
  key: string;
  name: string;
  imageFull: string;
}

export interface ItemInfo {
  id: string;
  name: string;
  imageFull: string;
}

export interface SpellInfo {
  id: string;
  key: string;
  name: string;
  imageFull: string;
}

export interface RuneReforgedSlot {
  runes: Array<{ id: number; key: string; icon: string; name: string }>;
}

export interface RuneReforgedTree {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: RuneReforgedSlot[];
}

// --- Cache state ---

const cache: {
  patch: string | null;
  patchFetchedAt: number | null;
  champions: ChampionInfo[] | null;
  championByKey: Map<string, ChampionInfo> | null;
  championById: Map<string, ChampionInfo> | null;
  items: ItemInfo[] | null;
  itemById: Map<string, ItemInfo> | null;
  spells: SpellInfo[] | null;
  spellByKey: Map<string, SpellInfo> | null;
  runes: RuneReforgedTree[] | null;
  dataFetchedAt: number | null;
} = {
  patch: null,
  patchFetchedAt: null,
  champions: null,
  championByKey: null,
  championById: null,
  items: null,
  itemById: null,
  spells: null,
  spellByKey: null,
  runes: null,
  dataFetchedAt: null,
};

function isCacheValid(fetchedAt: number | null): boolean {
  if (fetchedAt == null) return false;
  return Date.now() - fetchedAt < CACHE_TTL_MS;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Data Dragon ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

export async function getCurrentPatch(): Promise<string> {
  if (cache.patch != null && isCacheValid(cache.patchFetchedAt)) {
    return cache.patch;
  }
  const versions = await fetchJson<string[]>(`${DD_BASE}/api/versions.json`);
  const patch = versions[0];
  if (!patch) throw new Error("No patch in versions.json");
  cache.patch = patch;
  cache.patchFetchedAt = Date.now();
  return patch;
}

async function ensureDataLoaded(): Promise<string> {
  const patch = await getCurrentPatch();
  if (
    cache.champions != null &&
    cache.items != null &&
    cache.spells != null &&
    isCacheValid(cache.dataFetchedAt)
  ) {
    return patch;
  }
  const [champRes, itemRes, spellRes] = await Promise.all([
    fetchJson<DDChampionData>(
      `${DD_BASE}/cdn/${patch}/data/en_US/champion.json`,
    ),
    fetchJson<DDItemData>(`${DD_BASE}/cdn/${patch}/data/en_US/item.json`),
    fetchJson<DDSummonerData>(
      `${DD_BASE}/cdn/${patch}/data/en_US/summoner.json`,
    ),
  ]);

  const champions: ChampionInfo[] = [];
  const championByKey = new Map<string, ChampionInfo>();
  const championById = new Map<string, ChampionInfo>();
  for (const [_, c] of Object.entries(champRes.data)) {
    const info: ChampionInfo = {
      id: c.id,
      key: c.key,
      name: c.name,
      imageFull: c.image.full,
    };
    champions.push(info);
    championByKey.set(c.key, info);
    championById.set(c.id, info);
  }

  const items: ItemInfo[] = [];
  const itemById = new Map<string, ItemInfo>();
  for (const [id, item] of Object.entries(itemRes.data)) {
    if (!item?.image?.full) continue;
    const info: ItemInfo = {
      id,
      name: item.name ?? "",
      imageFull: item.image.full,
    };
    items.push(info);
    itemById.set(id, info);
  }

  const spells: SpellInfo[] = [];
  const spellByKey = new Map<string, SpellInfo>();
  for (const [_, s] of Object.entries(spellRes.data)) {
    const info: SpellInfo = {
      id: s.id,
      key: s.key,
      name: s.name,
      imageFull: s.image.full,
    };
    spells.push(info);
    spellByKey.set(s.key, info);
  }

  cache.patch = patch;
  cache.champions = champions;
  cache.championByKey = championByKey;
  cache.championById = championById;
  cache.items = items;
  cache.itemById = itemById;
  cache.spells = spells;
  cache.spellByKey = spellByKey;
  cache.runes = null; // loaded separately; runesReforged endpoint may 403
  cache.dataFetchedAt = Date.now();
  return patch;
}

export async function getChampions(): Promise<ChampionInfo[]> {
  await ensureDataLoaded();
  return cache.champions ?? [];
}

export async function getChampionByKey(
  key: string,
): Promise<ChampionInfo | null> {
  await ensureDataLoaded();
  return cache.championByKey?.get(key) ?? null;
}

export async function getChampionById(
  id: string,
): Promise<ChampionInfo | null> {
  await ensureDataLoaded();
  return cache.championById?.get(id) ?? null;
}

/** Lookup by numeric champion id (from match data). */
export async function getChampionByNumericId(
  numericId: number,
): Promise<ChampionInfo | null> {
  await ensureDataLoaded();
  return cache.championByKey?.get(String(numericId)) ?? null;
}

export async function getChampionMap(): Promise<Record<string, ChampionInfo>> {
  await ensureDataLoaded();
  const map: Record<string, ChampionInfo> = {};
  cache.championByKey?.forEach((v, k) => {
    map[k] = v;
  });
  return map;
}

export async function getItems(): Promise<ItemInfo[]> {
  await ensureDataLoaded();
  return cache.items ?? [];
}

export async function getItemById(id: string): Promise<ItemInfo | null> {
  await ensureDataLoaded();
  return cache.itemById?.get(id) ?? null;
}

export async function getSummonerSpells(): Promise<SpellInfo[]> {
  await ensureDataLoaded();
  return cache.spells ?? [];
}

export async function getSpellByKey(key: string): Promise<SpellInfo | null> {
  await ensureDataLoaded();
  return cache.spellByKey?.get(key) ?? null;
}

/** Lookup by numeric spell id (from match data). */
export async function getSpellByNumericId(
  numericId: number,
): Promise<SpellInfo | null> {
  await ensureDataLoaded();
  return cache.spellByKey?.get(String(numericId)) ?? null;
}

export async function getRunesReforged(): Promise<RuneReforgedTree[]> {
  await ensureDataLoaded();
  if (cache.runes != null) return cache.runes;
  try {
    const runes = await fetchJson<RuneReforgedTree[]>(
      `${DD_BASE}/api/data/en_US/runesReforged.json`,
    );
    cache.runes = runes;
    return runes;
  } catch {
    cache.runes = [];
    return [];
  }
}

/**
 * Build CDN URL for champion image.
 * Example: https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Aatrox.png
 */
export function championImageUrl(patch: string, imageFull: string): string {
  return `${DD_BASE}/cdn/${patch}/img/champion/${imageFull}`;
}

export function itemImageUrl(patch: string, imageFull: string): string {
  return `${DD_BASE}/cdn/${patch}/img/item/${imageFull}`;
}

export function spellImageUrl(patch: string, imageFull: string): string {
  return `${DD_BASE}/cdn/${patch}/img/spell/${imageFull}`;
}
