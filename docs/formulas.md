# Formula documentation

## Leaderboard rating formula

The leaderboard uses a **single rating** per player. After each 5v5 match, every participant’s rating is updated using a performance-blended Elo-style update that is **zero-sum** over the 10 players in that match (no long-term inflation).

### Constants

- **K** = 32 (maximum rating change per game; effective change is clamped to ±24).
- **Win weight** = 0.65 (65% of “actual” comes from win/loss, 35% from performance).
- **Scale** = 400 (Elo scale for expected score).

### Step 1: Expected score (per team)

For each team, the expected score is the standard Elo probability of beating the other team, based on average rating:

- \( \bar{R}_{\text{us}} \) = average rating of the 5 players on your team (before the match).
- \( \bar{R}_{\text{them}} \) = average rating of the 5 players on the opposing team.

Then:

\[
E = \frac{1}{1 + 10^{(\bar{R}_{\text{them}} - \bar{R}_{\text{us}})/400}}
\]

So \( E \) is in \((0, 1)\). The same \( E \) is used for all 5 players on your team. The sum of the 10 players’ expected scores is 5 (each team’s 5 players share one “expected win” between the two teams).

### Step 2: Raw actual score (per player)

For each player in the match:

- **If OP score is missing** (e.g. no timeline):  
  \( a = 1 \) if their team won, \( a = 0 \) if their team lost.

- **If OP score is present** (0–10):  
  \[
  a = 0.65 \cdot \mathbb{1}_{\text{win}} + 0.35 \cdot \frac{\text{op\_score}}{10}
  \]  
  with \( \text{op\_score} \) clamped to \([0, 10]\). So \( a \in [0, 1]\).

### Step 3: Zero-sum scaling

Let \( a_i \) be the raw actual for player \( i \) (\( i = 1..10 \)), and

\[
S = \sum_{i=1}^{10} a_i.
\]

- If \( S = 0 \): set scaled actual \( \tilde{a}_i = 0.5 \) for every player.
- If \( S > 0 \):  
  \[
  \tilde{a}_i = a_i \cdot \frac{5}{S}.
  \]

Then \( \sum_{i=1}^{10} \tilde{a}_i = 5 \), so the total “actual” in the match equals the total “expected,” and the sum of rating changes over the 10 players is zero.

### Step 4: Rating update (per player)

For each player, with their team’s expected score \( E \) and their scaled actual \( \tilde{a} \):

\[
\Delta = \text{round}\Bigl(\text{clamp}\bigl(32 \cdot (\tilde{a} - E),\ -24,\ 24\bigr)\Bigr),
\]

\[
\text{rating}_{\text{new}} = \text{rating}_{\text{old}} + \Delta.
\]

So the change is capped at ±24 points per game.

---

## OP Score formula

OP Score is a **0–10** performance score for each participant in a match, stored as `numeric(5, 3)` so the UI can display one decimal while the leaderboard and MVP/ACE ordering use the full three-decimal precision.

The score is a **weighted sum of four pillars**, each mapped to \([0, 1]\):

- **Combat (C)** — teamfight impact, damage, kill participation, smart KDA.
- **Economy (E)** — gold earned and CS/min, normalized **within the same role bucket**.
- **Utility (U)** — vision, crowd control, tanking / mitigation, structure damage.
- **Timeline (T)** — time-weighted progression across cadence snapshots plus an explicit game-end anchor. `T` is omitted in the fallback path (no timeline frames).

All normalizations use **within-match** bounds. Where the denominator would be zero, we clamp to a tiny positive floor so any non-zero player stays at the top of their pillar. Every term is clipped to \([0, 1]\).

### Four pillars

Let `duration_min = duration_sec / 60` and, for a player on team `t`, `team_dmg`, `team_taken`, `team_mitig`, `team_kills` be the sum over all 5 teammates. For every ratio we divide by the team value and clip to \([0, 1]\).

#### Combat

Lobby max kills \(\max_{\text{match}} K\) (floored at 1) scales raw kill volume alongside team shares:

\[
C = 0.32 \cdot \operatorname{clip}\!\left(\tfrac{\text{dmg\_share}}{\max_{\text{match}}\text{dmg\_share}}\right)
  + 0.28 \cdot \operatorname{clip}\!\left(\tfrac{K + A}{\text{team\_kills}}\right)
  + 0.22 \cdot \operatorname{clip}\!\left(\tfrac{(K + 0.75 A)/\max(D, 1)}{\max_{\text{match}}(\cdot)}\right)
  + 0.18 \cdot \operatorname{clip}\!\left(\tfrac{K}{\max_{\text{match}} K}\right).
\]

#### Economy (role-fair)

Each participant is mapped to a role bucket (see below). For `(match, role)` we take the role-local max for gold and CS/min.

\[
E = 0.55 \cdot \operatorname{clip}\!\left(\tfrac{\text{gold\_earned}}{\max_{\text{role}}(\text{gold\_earned})}\right)
  + 0.45 \cdot \operatorname{clip}\!\left(\tfrac{\text{CS/min}}{\max_{\text{role}}(\text{CS/min})}\right).
\]

#### Utility

\[
U = 0.38 \cdot \operatorname{clip}\!\left(\tfrac{\text{vision/min}}{\max_{\text{match}}(\cdot)}\right)
  + 0.22 \cdot \operatorname{clip}\!\left(\tfrac{\text{time\_ccing\_others}}{\max_{\text{match}}(\cdot)}\right)
  + 0.25 \cdot \operatorname{clip}\!\left(\tfrac{\max(\text{dmg\_taken\_share},\ \text{self\_mitig\_share})}{\max_{\text{match}}(\cdot)}\right)
  + 0.15 \cdot \operatorname{clip}\!\left(\tfrac{\text{turret\_kills} + \text{inhibitor\_kills}}{\max_{\text{match}}(\cdot)}\right).
\]

#### Timeline

Snapshots at `t = cadence, 2·cadence, …` plus one extra snapshot anchored at `t = duration_sec` (the end of the game). `cadence = 300s` on Summoner's Rift and `180s` on ARAM (`map_id = 12` or queue 100 / 450 / 900 / 920).

For each snapshot we take the closest timeline frame and compute:

- `eco_snap = (gold_role_norm + xp_role_norm + cs_role_norm) / 3` with role-local per-snapshot maxes.
- `combat_snap = (kda_norm + kp_norm) / 2` from events cumulative up to `target_ts`, normalized by the global per-snapshot max.
- `snap = 0.55 · eco_snap + 0.45 · combat_snap`.

Later snapshots are weighted more so the end-game anchor dominates:

\[
w(t) = 0.5 + \tfrac{t}{\text{duration\_sec}},\qquad
T = \tfrac{\sum_i w_i \cdot \text{snap}_i}{\sum_i w_i}.
\]

`w(early) ≈ 0.5…1.0` rises linearly to `w(end) = 1.5`, so the final snapshot counts roughly 3× an opening one without ever fully drowning out progression.

### Role buckets

Effective bucket `_op_effective_role_bucket` (SQL):

1. **Summoner's Rift + exactly 10 participants** (`matches.map_id = 11` and 10 rows in `match_participants`): fixed **lobby slot** from Riot `participantId` (custom 5v5 seat order): ids **1–5** and **6–10** each map **TOP → JUNGLE → MID → CARRY → SUPPORT**. If `participant_id` is missing or outside 1–10, fall back to the Riot heuristic below.
2. **Exactly 10 participants but not SR** (any other `map_id`): **UNKNOWN** for everyone (avoid wrong lane weights on other maps).
3. **Otherwise** (not 10 players, or no match row): Riot heuristic from `match_participants.role` / `lane` via `_op_role_bucket` — CS tiebreaker for ambiguous BOTTOM duos, neutral-minion floor for jungle.

| Rule (heuristic fallback `_op_role_bucket`) | Bucket |
|------|--------|
| `role = 'DUO_SUPPORT'` | SUPPORT |
| `role = 'DUO_CARRY'` | CARRY |
| `lane = 'JUNGLE'` or `neutral_minions >= 60` | JUNGLE |
| `lane = 'BOTTOM'` and `minions < 50` | SUPPORT |
| `lane = 'BOTTOM'` and `minions >= 50` | CARRY |
| `lane = 'MIDDLE'` | MID |
| `lane = 'TOP'` | TOP |
| otherwise | UNKNOWN |

### Role-aware pillar weights (sum to 1 per role)

| Role | w_C | w_E | w_U | w_T |
|------|-----|-----|-----|-----|
| CARRY   | 0.42 | 0.25 | 0.10 | 0.23 |
| MID     | 0.42 | 0.23 | 0.12 | 0.23 |
| TOP     | 0.33 | 0.25 | 0.19 | 0.23 |
| JUNGLE  | 0.33 | 0.22 | 0.22 | 0.23 |
| SUPPORT | 0.25 | 0.12 | 0.40 | 0.23 |
| UNKNOWN | 0.35 | 0.25 | 0.17 | 0.23 |

`T` is fixed at **0.23** across roles: progression is a supporting signal, not the main story. Carry/mid combat weights are capped at **0.42** for `w_C` so damage and kills still share the score with economy, utility, and timeline.

### Final composite

\[
\text{OP Score} = \operatorname{round}\!\left(10 \cdot \left(w_C\,C + w_E\,E + w_U\,U + w_T\,T\right),\ 3\right),
\]

stored as `numeric(5, 3)`. The UI rounds to one decimal for display; the leaderboard / MVP logic uses the stored value.

### Fallback (no timeline frames or duration below cadence)

`T` is omitted and its 0.23 is redistributed proportionally across `C`, `E`, `U`:

| Role | w_C | w_E | w_U |
|------|-----|-----|-----|
| CARRY   | 0.54 | 0.33 | 0.13 |
| MID     | 0.54 | 0.30 | 0.16 |
| TOP     | 0.43 | 0.32 | 0.25 |
| JUNGLE  | 0.43 | 0.29 | 0.28 |
| SUPPORT | 0.32 | 0.16 | 0.52 |
| UNKNOWN | 0.46 | 0.32 | 0.22 |

\[
\text{OP Score} = \operatorname{round}\!\left(10 \cdot \left(w_C\,C + w_E\,E + w_U\,U\right),\ 3\right).
\]

### MVP / ACE (deterministic)

Within each team's win/loss partition:

1. `op_score DESC`
2. `(w_C · C + w_U · U) DESC` — combat + utility impact
3. `dmg_share DESC`
4. **`kills DESC`**
5. `vision_per_min DESC`
6. `participant_id ASC`

`MVP = rn 1` on the winning team, `ACE = rn 1` on the losing team. After assignment, **MVP's stored `op_score` is set to at least the ACE's `op_score`** on that match (`greatest(mvp, ace)`), so MVP never ranks below ACE on the score column.

With three decimals of precision and four normalized pillars, true ties are rare; the tie-breakers above give a strict total order within each partition.

### Why this is better than the old 75 / 15 / 10 blend

- **Vision is no longer a flat 10%.** A carry's vision contribution is `w_U × 0.30 ≈ 3%`; a support's is `0.40 × 0.30 = 12%` — in line with what each role actually cares about.
- **End-game matters first.** `C + E + U` carry 77% of the score across roles (vs. 25% before) and use stats we previously ignored (CC, tanking, objectives).
- **Timeline is progression, not the whole story.** 23% with time-weighting and an explicit end-of-game anchor instead of 75% of a sparse flat mean that dropped the last `duration % cadence` minutes entirely.
- **Role fairness.** Supports can win on vision / CC / tanking; tanks on mitigation + CC; carries on damage + kills + gold.

### Research references

- OP.GG — [OP Score explained](https://help.op.gg/hc/en-us/articles/31088715328665-OP-Score-explained).
- LoL Tracker — [MVP Score explanation](https://www.lol-tracker.com/mvp-score-explanation) (explicit pillars).
- Spectral.gg — [MVP formula](https://spectral.gg/docs/mvp_formula) (role factors, late-game weighting).
- PandaSkill — [arXiv 2501.10049](https://arxiv.org/abs/2501.10049) (role-isolated modeling).
