"use client";

import { champion } from "@v1/game-assets/champions";
import {
  championImageUrl,
  itemImageUrl,
  spellImageUrl,
} from "@v1/game-assets/urls";
import { Badge } from "@v1/ui/badge";
import { cn } from "@v1/ui/cn";
import type { GameForUi } from "@/electron-api";
import { creepScore, formatDuration, formatGameDate, itemIds } from "./games";

interface GameCardProps {
  game: GameForUi;
  isSelected: boolean;
  onToggle: () => void;
  /** The patch game assets are drawn from. */
  patch: string;
}

/** A custom game from the client's history, seen from the signed-in player, to tick for saving. */
export function GameCard({ game, isSelected, onToggle, patch }: GameCardProps) {
  const { match, isSaved } = game;
  const self = match.participants[0];
  if (!self) return null;

  const stats = self.stats;
  const played = champion(self.championId);

  return (
    <article
      className={cn(
        "relative flex w-full items-stretch gap-3 overflow-hidden rounded-none border-x-0 border-b border-t-0 border-zinc-700/50 bg-zinc-900/95 px-3 py-2.5",
        isSaved && "opacity-80",
      )}
    >
      <div className="absolute left-0 right-0 top-0 h-px bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/30 to-transparent" />

      {/* Left: checkbox, champion icon + level, outcome, mode, spells */}
      <div className="flex shrink-0 items-start gap-2 pt-0.5">
        <div className="flex flex-col items-center gap-1">
          <input
            type="checkbox"
            id={`game-${match.gameId}`}
            checked={isSelected}
            disabled={isSaved}
            onChange={onToggle}
            className="size-4 shrink-0 rounded border-amber-500/50 bg-zinc-800 text-amber-500 focus:ring-amber-500/50"
          />
          <div className="relative flex size-10 shrink-0 overflow-hidden rounded-full border border-amber-500/30 bg-zinc-800">
            {/* A champion released since the list was generated has no art until it is regenerated. */}
            {played ? (
              <img
                src={championImageUrl(patch, played.imageFile)}
                alt={played.name}
                className="size-full object-cover"
              />
            ) : null}
            <span className="absolute bottom-0 right-0 rounded-tl-lg bg-black/80 px-1 text-[10px] font-medium text-white">
              {stats.champLevel}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-wide",
              stats.win ? "text-cyan-500" : "text-red-500",
            )}
          >
            {stats.win ? "Victory" : "Defeat"}
          </span>
          <span className="text-[11px] text-zinc-500">Custom</span>
          <div className="flex gap-0.5 pt-0.5">
            {[self.spell1Id, self.spell2Id].map((spellId, slot) => (
              <img
                key={slot}
                src={spellImageUrl(patch, spellId)}
                alt=""
                className="size-4 rounded border border-amber-500/20 object-cover"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Middle: items, KDA, CS, gold */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex gap-0.5">
          {itemIds(stats).map((id, slot) => (
            <div
              key={slot}
              className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded border border-amber-500/20 bg-zinc-800/80"
            >
              {id ? (
                <img
                  src={itemImageUrl(patch, id)}
                  alt=""
                  className="size-full object-cover"
                />
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>
            {stats.kills} / {stats.deaths} / {stats.assists}
          </span>
          <span>{creepScore(stats)}</span>
          <span>{stats.goldEarned.toLocaleString()}</span>
        </div>
      </div>

      {/* Right: map, duration, date, Saved badge */}
      <div className="flex shrink-0 flex-col items-end justify-center gap-0.5">
        <span className="text-xs text-zinc-400">Summoner&apos;s Rift</span>
        <span className="text-[11px] text-zinc-500">
          {formatDuration(match.gameDuration)}
          <span className="mx-1 text-zinc-600">·</span>
          {formatGameDate(match.gameCreation)}
        </span>
        {isSaved && (
          <Badge
            variant="secondary"
            className="mt-1 border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          >
            Saved
          </Badge>
        )}
      </div>
    </article>
  );
}
