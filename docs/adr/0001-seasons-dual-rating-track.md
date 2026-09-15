# 0001 — Ladder seasons with a parallel all-time rating track

- Status: accepted
- Date: 2026-09-15

## Context

The ladder had a single rating per player accumulated since the first game. We want seasons: every
game played so far becomes Season 1, Season 2 starts fresh, and the app shows one season at a time
(leaderboard, match history, Hall of Fame, duos, player profile) with an "all seasons" option.

## Decision

1. **Season is derived from the game date.** `seasons(id, number, starts_at)`; a trigger stamps
   `matches.ladder_season_id` from `game_creation`, ignoring any client value. Season 2 starts at the
   moment the migration runs, so every existing game is Season 1.
2. **Hard reset per season.** Each season starts everyone at 1000 with wins, losses, averages and
   streaks from zero.
3. **Parallel all-time track.** `ratings` and `rating_history` are keyed by `ladder_season_id`
   (season id, or `0` for all-time). `apply_rating_update_for_match` runs the unchanged rating
   algorithm once per track, with expected scores based on that track's ratings. The migration copies
   the existing (Season 1) rows into track 0 because the two are identical at that point, so no replay is
   needed.
4. **New column instead of reusing `matches.season_id`.** Riot's `season_id` is written by already
   distributed LCU clients; renaming or repurposing it would break them or change what the column means.
5. **Late uploads are accepted.** A game from an ended season uploaded later still lands in that
   season and updates its standings; seasons are not frozen.
6. **Seasons are created by migration**, not through an admin UI.

## Consequences

- Leaderboard history ("after N games"), Hall of Fame and profile stats work identically for a
  season and for all-time; queries only switch the track.
- `rating_history` stores two rows per participant per game.
- Ratings are applied in upload order (pre-existing behaviour). A late Season 1 upload therefore
  changes the all-time track after Season 2 games that were already applied.
