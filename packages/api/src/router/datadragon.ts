import { z } from "zod";
import {
  getChampionById,
  getChampionByKey,
  getChampionByNumericId,
  getChampionMap,
  getChampions,
  getCurrentPatch,
  getItemById,
  getItems,
  getRunesReforged,
  getSpellByKey,
  getSpellByNumericId,
  getSummonerSpells,
} from "../datadragon";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const datadragonRouter = createTRPCRouter({
  currentPatch: publicProcedure.query(() => getCurrentPatch()),

  champions: publicProcedure.query(() => getChampions()),

  championMap: publicProcedure.query(() => getChampionMap()),

  championByKey: publicProcedure
    .input(z.object({ key: z.string().min(1) }))
    .query(({ input }) => getChampionByKey(input.key)),

  championById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => getChampionById(input.id)),

  championByNumericId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getChampionByNumericId(input.id)),

  items: publicProcedure.query(() => getItems()),

  itemById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getItemById(input.id)),

  summonerSpells: publicProcedure.query(() => getSummonerSpells()),

  spellByKey: publicProcedure
    .input(z.object({ key: z.string().min(1) }))
    .query(({ input }) => getSpellByKey(input.key)),

  spellByNumericId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getSpellByNumericId(input.id)),

  runes: publicProcedure.query(() => getRunesReforged()),
});
