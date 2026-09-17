# Hall of Fame UI research

Date: 2026-09-17. Status: research input, not a decision (no ADR).

## 1. Question and scope

What makes a records, awards or Hall of Fame page engaging for a small community stats app, instead of a
flat grid of title cards? And how should Derby's Hall of Fame change?

**Today:** `apps/app/src/components/hof/hof-grid.tsx` renders 37 cards (not 35) in a 1/2/3-column grid,
in the fixed order of `HOF_TITLES`. Each card shows a title, a description, one holder and one value with no
unit. `hofLeaders` (`packages/api/src/router/rift-rank.ts`) makes one `ratings` query per title with
`.limit(1)` against qualified players on the selected rating track.

**Method:** I checked product pages, official help centres, newsrooms and engineering blogs. Quotes come
from a fetch tool that summarises pages, so treat the wording as close to the source, not exact. Section 5
lists sources I couldn't reach or check. References like [S1] point to that section.

## 2. Findings

### 2.1 Information hierarchy

- **Riot Challenges** groups hundreds of challenges into five categories: Expertise, Teamwork & Strategy,
  Imagination, Veterancy and Collection. A sixth group, Legacy, holds time-limited seasonal challenges that
  "don't contribute to overall progress" [S1][S2]. The grouping is by *kind of play*, not by stat.
- **NBA.com**'s season awards page puts the MVP first with a large image. All-NBA and All-Defensive teams
  follow, then a winners list. An "ALL-TIME AWARDS" block with links to history sits at the bottom [S25].
  One headline award leads and the rest are secondary.
- **Sleeper League History** splits records into League Champs, All-Time Standings, All-Time Weekly High
  Scores, All-Time Player High Scores, Playoff Brackets and "Toilet Bowl / Consolation Brackets" [S27]. Glory
  and shame get their own sections.
- **ESPN Fantasy achievements** run "from being the league champion to being the worst team in the league,
  winning multiple games in a row or even losing multiple games in a row" [S29]. Positive and negative
  achievements sit side by side as equals.
- **OP.GG's leaderboard** is one flat table (#, Summoner, Tier, LP, Most champions, Level, Win rate) that
  starts at #1, with no featured cards for the top players [S5].
- **League of Graphs** gives each stat its own records page. Page titles such as "Kills (Iron+) - Records",
  "Kills @10 (Platinum+) (NA) - Records" and "Dragons killed (Platinum+) - Records" point to a minimum-tier
  filter and a region filter [S7]. Cloudflare blocked the page itself, so the layout is unverified.

### 2.2 Showing the holder and the value

- **UEFA**'s Player of the Season article names the winner and then gives a labelled stat block: "Appearances:
  16, Minutes played: 1,141, Goals: 10, Assists: 6, Distance covered: 124.17km, Top speed: 33.7km/h" [S26].
  Every number carries a label and a unit.
- **OP.GG** shows win rate as raw counts plus the rate, "238W 125L 66%" [S5], so the sample size is visible.
- **Steam** lists each achievement with its icon, name and description. A global stats page shows "the
  percentage of Steam players of the game that have achieved each one, ordered from most common to the
  rarest" [S20].
- **Strava** marks record holders with an icon on the object itself: a crown for the fastest time and a
  laurel crown for the Local Legend. Both appear on the activity and segment pages [S8][S10].

### 2.3 Runners-up and competition

- **Strava** awards trophies "for 2nd- to 10th-place finishes in all-time efforts", not just the crown for
  first [S8]. Subscribers can compare "their efforts … to the current LCL, overall efforts, women's efforts,
  and their mutual followers' efforts" [S10] on a histogram leaderboard [S13]. Strava's own story tells users
  to "check out how close your competition is" [S14].
- **Riot Challenges**: at Master tier or above, hovering a challenge shows "where you stack up against the
  rest of your server". On another player's token you also see "how your progress stacks up against theirs".
  The end-of-game screen has "a progression carousel" of challenges you "leveled up, brought close to
  leveling up, or had a standout performance on" [S3]. Near-misses are shown on purpose.
- **Riot's Grandmaster and Challenger tiers** are relative: "top 25%" and "top 5%" of players who reached
  Master. Ladders are "recalculated every 24 hours" [S1].
- **Duolingo** leagues reset weekly. The "top XP earners advance to the next league" and you "climb up (or
  down)" [S31]. The look of the promotion and demotion zones is unverified.

### 2.4 History of title changes

- **NBA.com** lists MVP winners newest first, one line each ("2025-26 — Shai Gilgeous-Alexander, Oklahoma
  City Thunder"), back to 1955-56 [S23]. A companion page ranks repeat winners by count ("Kareem Abdul-Jabbar
  (6)") and notes that "nine players have won at least three MVPs" [S24].
- **UEFA** closes the award article with previous winners, newest first ("2024/25: Ousmane Dembélé
  (Paris)") [S26].
- **ESPN Fantasy**: "Once your league enters into its second season … you'll see a tally of past winners"
  [S30].
- **Strava** emails "Lost KOM/QOM/CR" notifications [S12]. Losing a title is treated as an event. The
  "My KOMs/QOMs/CRs" list shows only segments "in which you are currently first place" [S9]. I found no
  history of titles a player used to hold.
- **Spotify Wrapped 2025**'s "Top Artist Sprint" shows "how your top five artists shifted in your personal
  rankings month by month" [S15]. A ranking over time becomes the story.

### 2.5 Per-season vs all-time

- **Strava** leaderboards filter by "the current day, week, month, or year" as well as all-time [S11]. Local
  Legend uses a rolling 90-day window, while the KOM is all-time [S8][S10]. Two titles on one segment use two
  time windows.
- **Riot**: Legacy challenges are seasonal and kept apart from overall progress [S2]. Victorious rewards
  come from "your final rank for that season" [S4], so each season leaves a lasting mark.
- **NBA.com** leads with the current season's winners and keeps all-time history as a separate section
  [S25].

### 2.6 Shareability

- **Spotify Wrapped**: users "send them directly to your friends using Spotify Messages, or post them to your
  favorite social channels" [S15]. In 2019 Spotify built a backend that renders a "personalized, shareable card
  for each story and user" from HTML and CSS templates [S17]. "Me in 2023" used "12 possible … characters"
  that users "flip" and share [S16]: a playful label based on data.
- **Riot**: players pick titles, and "Titles appear in your profile, lobby and loading screen". Up to three
  tokens can be shown [S1]. Identity comes from choosing what to show off.
- **Sleeper** posts its Weekly Reports with awards into league chat every Tuesday [S28]. Sharing happens
  where the group already talks.

### 2.7 Tone and motion

- **Sleeper** frames its awards as "ultimate shaming or bragging rights" [S28]. Garmin names badges
  playfully, for example "I Am the Night" for activities between 10 p.m. and 4 a.m. [S32].
- **Spotify** keeps playful stories tied to data: "every insight had to be traceable to actual listening
  behavior" [S19].
- **Spotify on animation**: the 2019 MVP shipped "static stories … no animations whatsoever" [S17]. For
  2023, the team asked whether animation was "important enough that we'd feel comfortable with increasing our
  payload size" [S18].
- **Xbox** keeps special motion for the moment something is earned. A rare achievement brings "a special
  notification and diamond icon" [S21]. A 2026 update adds "updated icons and animations when you unlock
  classic or rare achievements" [S22].

## 3. Recommendations for Derby (ranked)

Constraints for every recommendation: no accent colour, numbers in Geist Mono, uppercase mono labels, sharp
corners, motion only on state change (150–400 ms, one easing curve), and nothing that competes with the home
page's season podium.

### R1. Group titles into stat rows that pair best and worst

- **Decision:** replace the card grid with ruled rows grouped under uppercase mono section labels. One stat
  gets one row, with the best holder on the left and the worst on the right.
  - Nine stats in `SIMPLE` already have a best and a worst title on the same column: `avg_kills` (Most Kills,
    Pacifist), `avg_assists`, `avg_vision_score`, `avg_damage_to_champions`, `avg_gold_earned`, `avg_heal`,
    `avg_turret_kills`, `avg_champ_level` and `avg_gold_spent`. That turns 18 cards into 9 rows.
  - Proposed sections: **Headline** (MVP, ACE, OP score, Bottom of the Ladder), **Fighting**, **Farm &
    gold**, **Map & utility** and **Form** (Tilted, Cold, Veteran of Defeat, Worst Win Rate, Never MVP, Never
    ACE).
- **Why:** Riot, Sleeper and NBA.com all group records and lead with one headline (2.1). ESPN treats
  "worst" awards as equals (2.1). The best-and-worst pairing is where the banter happens.
- **Design fit:** hairline rules instead of cards, and no red for "worst" because red means a loss. Mark it
  with a mono `WORST` label. Gold and violet appear only on the MVP and ACE rows. On phones the two sides of a
  row stack.
- **Data:** none. Add `group` and `pairId` to `HOF_TITLES` in `hof-config.ts`.

### R2. Show the runner-up and the gap, and let tied players share a title

- **Decision:** each side of a row shows the holder, the value with its unit, and a secondary line such as
  "2nd · Name · 4.5 (−0.3)". Players tied on the value share the title.
- **Why:** Strava and Riot put "how close" right next to the title (2.3). Today `.limit(1)` picks an
  arbitrary holder when players tie. `docs/formulas.md` already says tied ratings share a standings position.
- **Design fit:** the gap is plain Geist Mono in muted foreground, with no badge.
- **Data:** no new tables. Change `hofLeaders` to return the top 3 (plus everyone tied) and
  `matches_played` from `ratings`. This is a good moment to replace the 37 queries with one SQL function or
  view.

### R3. Fix title definitions and units before exposing gaps

- **Decision:** make each title's label, copy and query agree, and give every value a unit ("per match" or
  "total").
- **Why:** UEFA and OP.GG label every number (2.2), and a gap built on a wrong definition only makes the
  error more visible. Mismatches in the current code:
  - `tilted` copy says "Longest losing streak", but the query uses `lose_streak`, the current streak.
    `ratings` has no column for the longest losing streak.
  - `cold` says "Never had a win streak", but it picks the lowest `best_streak`.
  - `worst_win_rate` copy says "10+ games", but the query uses qualification (5 matches).
  - `never_mvp` and `never_ace` say "most games", but they order by `wins`.
  - The copy says "game", but the glossary term is **Match**. Totals (pentas, losses, MVP count) reward volume
    and should say so.
  - CONTEXT.md gives "best streak" as a Hall of Fame example, but no positive best-streak title exists.
- **Data:** a true "longest losing streak" needs a new column in `ratings` and `rating_history`, set by the
  rating trigger (these tables aren't written by LCU clients). Otherwise, rename Tilted to "current losing
  streak". Update `en.ts` and `pl.ts` together.

### R4. Show titles that changed hands and how long a holder has held them

- **Decision:** add a short text strip at the top, such as "Changed on the last match day · KILLS / MATCH ·
  A took it from B". Each holder also gets a muted "since 12 Sep" or "for 23 matches".
- **Why:** Strava treats a lost KOM as an event worth an email (2.4). Spotify's Top Artist Sprint turns
  ranking changes into a story (2.4). The audience checks the app after game nights, so "what changed" is
  the hook.
- **Design fit:** text only. New rows get a single 300 ms neutral background fade the first time a viewer
  sees them: store the last-seen time in `localStorage` inside try/catch, and fall back to no highlight. No
  count-up animations, so the home podium stays the only "wow" moment.
- **Data (new query):** write a SQL function `hof_holders_at(track, at)` modelled on `leaderboard_at`, which
  already picks each player's latest snapshot. `rating_history` snapshots cover about 13 titles:
  - kills, assists and deaths averages
  - `mvp_games` and `ace_games`
  - `rating_after`, `losses` and wins/losses
  - `lose_streak` and `best_streak`
  The other ~24 titles (CS, vision, damage, gold, heal, CC, turrets, jungle, OP score, level, KDA,
  multikills) have two options:
  - (a) add snapshot columns to `rating_history` and replay history, or
  - (b) compute running values from `match_participants` joined to `matches.ladder_season_id`.
  Compute on read, not in a stored "changes" table, because late uploads reorder history (ADR 0001). Add
  pgTAP tests.

### R5. Add a player lens: full ranking on expand, highlight a player, deep link

- **Decision:** tapping a row expands it to the full ranking of qualified players. A player picker (or
  `?player=`) highlights that player's rows and titles and shows "you hold 4 titles".
- **Why:** Riot shows your standing against others and lets players show off their titles (2.3, 2.6).
  Strava lists your current crowns [S9]. With 10–30 players a full ranking fits in one expanded row.
- **Design fit:** 200 ms height expansion. The highlight is a foreground/background inversion, not a
  colour. The URL keeps `?season=`.
- **Data:** a lazy per-title query (one `ratings` column, all qualified players), or reuse R2's function
  without a limit. Signed-in users aren't linked to a `puuid` (`user_profiles` has none), so the picker is
  manual.

### R6. Add a season-by-season roll of honour, with title counts on All seasons

- **Decision:** on a season, show current holders (as today). Below them, add a collapsed "Previous seasons"
  list, newest first, with one line per season per title. On the All seasons track, add a "Most titles
  across seasons" list ranked by count.
- **Why:** NBA.com and UEFA (reverse-chronological lists, counts per player) and ESPN (tally of past
  winners), see 2.4. Riot and NBA.com keep a season's mark separate from all-time (2.5).
- **Design fit:** a typographic list with no badges or trophy imagery.
- **Data:** run R2's function per ladder season. Standings for an ended season can still change, so label
  them as standings and never call them "final".

### R7. Shareable player title card

- **Decision:** add `opengraph-image` for `/hof?player=…` that renders the player's held titles in the
  graphite/paper style, so links pasted into the group chat unfurl as a card.
- **Why:** Spotify's share card per story (2.6) and Sleeper posting into chat (2.6). Sharing happens in the
  group's existing chat.
- **Data:** none beyond R5. Uses `next/og`, which the app doesn't use yet.

### R8. (Later) Single-match records

- **Decision:** consider a separate "Single-match records" section (most kills in one match, highest OP
  score in one match), each linking to its match.
- **Why:** League of Graphs builds its records around single-game highs (2.1, unverified). These are the
  "new record" moments averages can't produce.
- **Data:** new query over `match_participants` by `matches.ladder_season_id`. It adds categories, so
  only do it after R1 reduces the clutter.

### Not recommended

- **Rarity percentages** (Steam, Riot top 5%): a percentile among 10–30 players is noise.
- **Tiers and a crystal:** they need progression data Derby doesn't have.
- **Wrapped-style tap-through stories:** they would compete with the home page season cover.

## 4. Open questions for the product owner

1. Keep all 37 titles, or merge near-duplicates (Gold Hoarder vs Big Spender, Broke vs Hoarder)?
2. Should a positive "Best streak" or "Best win rate" title exist? CONTEXT.md implies best streak.
3. On ties, share the title (proposed) or break the tie, for example by fewer matches?
4. Should any title need more than 5 matches? Worst Win Rate copy says 10.
5. Tilted: longest losing streak (needs a new column) or current losing streak?
6. "Changed" window: last match day for everyone, or since each viewer's last visit?
7. Can a player hide a "worst" title? Strava lets athletes opt out of Local Legends [S10]. Banter vs. comfort.
8. Should the player profile show the titles a player holds?

## 5. Sources

| Ref | Source |
| --- | --- |
| S1 | Riot Support, Challenges FAQ: https://support.riotgames.com/en-us/league-of-legends/gameplay/challenges-faq-league-of-legends |
| S2 | League of Legends, Challenges Walkthrough: https://www.leagueoflegends.com/en-us/news/game-updates/challenges-walkthrough/ |
| S3 | League of Legends, Challenges coming to PBE: https://www.leagueoflegends.com/en-gb/news/game-updates/challenges-coming-to-pbe/ |
| S4 | Riot Support, Ranked Years, Seasons, and End-of-Season Rewards: https://support.riotgames.com/en-us/league-of-legends/rewards/ranked-years-seasons-and-end-of-season-rewards/ |
| S5 | OP.GG leaderboard (live page): https://op.gg/leaderboards/tier |
| S6 | OP.GG Help, Understanding MVP and ACE criteria: https://help.op.gg/hc/en-us/articles/31092293690649-Understanding-MVP-and-ACE-criteria (**403**, search snippet only; not cited above) |
| S7 | League of Graphs records: https://www.leagueofgraphs.com/rankings/records/kills (**403 Cloudflare**; only page titles from search results) |
| S8 | Strava Help, What's a Segment: https://support.strava.com/en-us/articles/15402042-what-s-a-segment |
| S9 | Strava Help, Strava Segments: https://support.strava.com/en-us/articles/15401945-strava-segments |
| S10 | Strava Help, Local Legends: https://support.strava.com/en-us/articles/15401751-local-legends |
| S11 | Strava Help, Segment Leaderboard Filters: https://support.strava.com/en-us/articles/15401771-segment-leaderboard-filters |
| S12 | Strava Help, Strava Notifications: https://support.strava.com/hc/en-us/articles/216918367-Strava-Notifications |
| S13 | Strava Community Hub team, Your Guide to Local Legends: https://communityhub.strava.com/insider-journal-9/your-guide-to-local-legends-1506 |
| S14 | Strava Stories, How to Become Legendary: https://stories.strava.com/articles/how-to-become-legendary |
| S15 | Spotify Newsroom, 2025 Wrapped user experience: https://newsroom.spotify.com/2025-12-03/2025-wrapped-user-experience/ |
| S16 | Spotify Newsroom, Me in 2023: https://newsroom.spotify.com/2023-11-29/me-in-2023-streaming-habits-wrapped/ |
| S17 | Spotify Engineering, Unwrapped 2019: https://engineering.atspotify.com/2020/09/spotify-unwrapped-2019-how-we-built-an-in-app-experience-just-for-you |
| S18 | Spotify Engineering, Animation landscape of 2023 Wrapped: https://engineering.atspotify.com/2024/01/exploring-the-animation-landscape-of-2023-wrapped |
| S19 | Spotify Engineering, Inside the Archive (2025 Wrapped): https://engineering.atspotify.com/2026/3/inside-the-archive-2025-wrapped |
| S20 | Steamworks, Stats and Achievements: https://partner.steamgames.com/doc/features/achievements |
| S21 | Xbox Wire, Xbox Holiday Update (2016): https://news.xbox.com/en-us/2016/11/10/xbox-holiday-update/ |
| S22 | Xbox Wire, Xbox Insiders May 2026: https://news.xbox.com/en-us/2026/04/08/xbox-insiders-may-2026-console-features/ |
| S23 | NBA.com, MVP Award Winners: https://www.nba.com/news/history-mvp-award-winners |
| S24 | NBA.com, Players with at least 3 MVPs: https://www.nba.com/news/nba-players-with-at-least-3-mvps |
| S25 | NBA.com, 2025-26 NBA Awards: https://www.nba.com/awards/2026 |
| S26 | UEFA.com, Kvaratskhelia named 2025/26 Player of the Season: https://www.uefa.com/uefachampionsleague/news/02a5-20c1d7bf915e-f9e703cf0108-1000--khvicha-kvaratskhelia-named-2025-26-uefa-champions-league-/ |
| S27 | Sleeper Support, League History and Weekly Reports: https://support.sleeper.com/en/articles/3204499-league-history-and-weekly-reports |
| S28 | Sleeper Blog, League History and Weekly Reports with Awards: https://sleeper.com/blog/league-history-and-weekly-trophies/ |
| S29 | ESPN Fan Support, Achievements (ESPN Fantasy App): https://support.espn.com/hc/en-us/articles/52725306796692-Achievements-ESPN-Fantasy-App |
| S30 | ESPN, Fantasy Football 101: League and team pages: https://www.espn.com/fantasy/football/story/_/id/19541264/league-team-pages |
| S31 | Duolingo Blog, How Leaderboards and Leagues Work: https://blog.duolingo.com/duolingo-leagues-leaderboards/ |
| S32 | Garmin Blog, The 25 Garmin Connect Badges: https://www.garmin.com/en-US/blog/fitness/the-25-garmin-connect-badges-you-never-knew-you-needed/ |

**Unverified or not covered:**

- **u.gg:** returned 403, no records or awards page reviewed.
- **League of Graphs and OP.GG Help:** page bodies blocked (S6, S7).
- **Duolingo:** the look of the promotion and demotion zones. The help centre redirects to a page with no
  readable content.
- **Steam "Rarest Achievement Showcase":** only community forum posts, so excluded.
- **Riot:** no official source found for percentile or rarity shown in the client, or for the post-game Honor
  screen UI.
- **Strava:** notifications for gaining or losing Local Legend aren't documented. A community idea for
  history of lost KOMs returned 403.
