# Domain glossary

## Seasons

- **Season** (`seasons`, UI: "Sezon N" / "Season N") — a numbered ladder period that starts at
  `seasons.starts_at` and lasts until the next season starts. A game belongs to the season its
  `matches.game_creation` falls into (`matches.ladder_season_id`). Not to be confused with Riot's
  season (`matches.season_id`, sent by the LCU app and unused by the ladder).
- **Current season** — the season with the latest `starts_at <= now()`. The app shows it when no
  `?season=` is given.
- **All seasons** (`?season=all`, UI: "Wszystkie sezony" / "All seasons") — every game regardless of
  season, ranked on the all-time rating track.
- **Rating track** (`ratings.ladder_season_id`, `rating_history.ladder_season_id`) — an independent Elo
  progression. Each season has its own track (`ladder_season_id = N`, hard reset to 1000), and the
  all-time track (`ladder_season_id = 0`) never resets. Every rated game updates two tracks: its
  season's and all-time.
- **Season final rating** — a player's last `rating_history` snapshot within a season.

New seasons are created with a migration that inserts a row into `seasons`. See
[ADR 0001](docs/adr/0001-seasons-dual-rating-track.md).
