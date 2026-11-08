# 0008 — A rating track follows the order matches were played

- Status: accepted
- Date: 2026-11-08
- Amends: [0001](0001-seasons-dual-rating-track.md)

## Context

ADR 0001 kept the behaviour of applying ratings in upload order. Derby Sync saves matches in whatever
order a player ticks them, so a match can reach the database after one played later. Snapshots in
`rating_history` are dated by when the match was played, while their totals grow in upload order, so
"the latest snapshot" stopped being the current state: the standings, the season summary and the rating
chart showed a player one match behind their profile, and streaks ended at the wrong match.

Who uploads first should not decide anyone's rating.

## Decision

A rating track counts its matches in the order they were played (`game_creation`, then `match_id`). A
match that arrives after a later match of one of its players recounts that track from the start. If none
of its players has a later match on the track, nothing counted so far depends on it, and it is rated
incrementally as before.

The recount covers the whole track because `rating_history` does not keep every running total `ratings`
has, so it cannot resume from the middle.

## Considered options

- **Keep upload order and read snapshots by matches played.** No rating ever moves after the fact, but
  the result still depends on who uploaded first. Rejected for that reason.
- **Recount in the background.** It would keep uploads fast on a very large track, at the cost of a queue
  and standings that are briefly stale. Not needed yet: recounting 318 matches took about two seconds
  locally, and the all-time track holds 68.

## Consequences

- A late match can change the rating of players who were not in it, on its season's track and on the
  all-time track. Standings of an ended season can still move, as ADR 0001 accepts.
- The upload that triggers a recount waits for it, inside the request's statement timeout. If a track
  grows to where that limit is at risk, recount in the background.
- Tracks are locked per transaction, season first and all-time second, so concurrent uploads cannot
  deadlock or interleave a recount.
