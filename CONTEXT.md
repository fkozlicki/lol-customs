# Derby

An Elo ladder for a group's League of Legends custom games: matches uploaded from the League client are
rated, and players are ranked per season and across all seasons.

## Language

**Derby Sync**:
The desktop app a player installs to upload their matches from the League client.
_Avoid_: Niunio, LCU app

### Matches

**Match**:
A League of Legends custom game with ten players lasting at least five minutes. Only matches enter the
ladder; every other game in a player's client history is ignored, and every match is rated.
_Avoid_: Game, rated game

**Side**:
One of the two groups of five players within a match, blue or red.
_Avoid_: Team

**Team**:
Five players grouped before a match is played, for example by a shuffle.
_Avoid_: Side, squad

**Rivalry**:
The shared record of two players across the matches they both played, as teammates or as opponents.
_Avoid_: Duo (Riot's Solo/Duo queue), squad, crew

### Performance

**OP score**:
A score of how well a player performed in a match, judged against the role they played.

**MVP**:
The player with the highest OP score on the winning side of a match. The MVP never scores below the ACE.

**ACE**:
The player with the highest OP score on the losing side of a match.

**Hall of Fame**:
A set of record categories, such as most MVPs or best streak, that rank players within one rating track:
a season's or the all-time one.
_Avoid_: HoF, records

### Seasons

**Season**:
A numbered ladder period that begins at a fixed moment and lasts until the next season begins. A match
belongs to the season in which it was created.
_Avoid_: Split, Riot season (Riot's own season is unrelated to the ladder)

**Current season**:
The season that began most recently. It is what the app shows unless another season is chosen.

**All seasons**:
The view covering every match regardless of season, ranked on the all-time rating track.
_Avoid_: Overall, lifetime

**Rating track**:
An independent Elo progression. Each season has its own track on which everyone starts at 1000; the
all-time track never resets. Every match advances two tracks: its season's and the all-time one.

**Season standings**:
The ranking of players on a season's rating track. Standings of an ended season can still change when
one of its matches is uploaded late.
_Avoid_: Season final rating, final standings

**Streak**:
A player's run of consecutive wins or losses on a rating track, ending at their latest match. On a
season's track it starts from zero; on the all-time track it runs across season boundaries.

**Qualified player**:
A player with at least five matches on a rating track. Only qualified players hold a position in the
standings and appear in Hall of Fame and Rivalry; the rest are still qualifying on that track.
_Avoid_: Ranked player, active player

**Rating change**:
How much a single match raised or lowered a player's rating on a rating track.
_Avoid_: LP, delta, gain

**Best streak**:
The longest win streak a player has had on a rating track.
