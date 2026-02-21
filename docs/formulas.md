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

OP Score is a **0–10** performance score for each participant in a match. It is computed in two ways depending on whether **timeline data** is available.

### When timeline is missing or invalid (fallback)

Everything is based on **end-of-game** stats only. All metrics are normalized to \([0, 1]\) by the **match maximum** (best value in that match = 1).

1. **KDA ratio**  
   \( \text{KDA} = \frac{K + A}{\max(D, 1)} \).  
   Normalized: \( \text{kda\_norm} = \min\bigl(1,\ \text{KDA} / \max_{\text{match}}(\text{KDA})\bigr) \).

2. **Kill participation**  
   \( \text{KP} = \frac{K + A}{\text{team total kills}} \).  
   Already in \([0,1]\): \( \text{kp\_norm} = \min(1, \text{KP}) \).

3. **Damage share**  
   Damage share = your damage to champs / your team’s total damage to champs.  
   Normalized by match max share: \( \text{dmg\_norm} = \min(1,\ \text{share} / \max_{\text{match}}(\text{share}) \).

4. **CS per minute**  
   \( \text{CS/min} = \frac{\text{total CS}}{\text{game duration in minutes}} \).  
   Normalized: \( \text{cs\_norm} = \min(1,\ \text{CS/min} / \max_{\text{match}}(\text{CS/min}) \).

5. **Vision score**  
   Normalized: \( \text{vision\_norm} = \min(1,\ \text{vision} / \max_{\text{match}}(\text{vision}) \).

**Fallback OP Score:**

\[
\text{OP Score} = \text{round}\Bigl(10 \cdot \bigl(0.25\cdot\text{kda\_norm} + 0.25\cdot\text{kp\_norm} + 0.25\cdot\text{dmg\_norm} + 0.15\cdot\text{cs\_norm} + 0.10\cdot\text{vision\_norm}\bigr),\ 1\Bigr).
\]

So the result is in \([0, 10]\) with one decimal place.

---

### When timeline is available (every 5 minutes, role-fair)

The game is split into **5-minute windows** (5, 10, 15, … minutes). For each such time we take the timeline frame closest to that time and compute a **snapshot score** from data available then. We then average these snapshots and blend with end-of-game damage and vision.

#### Per 5-minute snapshot

At each 5-min mark we have, per player:

- **Gold, XP, CS** (minions + jungle) from that frame.
- **K, D, A** and **team kills** from all events up to that time → KDA ratio and KP at that moment.

Normalization:

- **Gold, XP, CS** are normalized **within role** (e.g. compare junglers to junglers, laners to laners) so no role is penalized for different farm patterns. For each (time, role), we take the max gold, max XP, max CS in that role and set:
  - \( \text{gold\_norm} = \min(1,\ \text{gold} / \max_{\text{same role}}(\text{gold}) \),
  - and similarly for **xp_norm** and **cs_norm**.
- **KDA** and **KP** at that time are normalized by the **match** maximum at that time (same for all roles).

Snapshot score for that time window (average of five 0–1 components):

\[
\text{snapshot} = \frac{\text{gold\_norm} + \text{xp\_norm} + \text{cs\_norm} + \text{kda\_norm} + \text{kp\_norm}}{5}.
\]

#### Timeline score (average over 5-min windows)

\[
\text{timeline\_score} = \frac{1}{N} \sum_{\text{5-min windows}} \text{snapshot},
\]

where \( N \) is the number of 5-minute windows in the game. So \( \text{timeline\_score} \in [0, 1] \).

#### End-of-game damage and vision

- **dmg_norm** = your damage share (your damage / team damage) divided by the match maximum of that share, capped at 1.
- **vision_norm** = your vision score divided by the match maximum vision score, capped at 1.

#### Final OP Score (timeline path)

\[
\text{OP Score} = \text{round}\Bigl(10 \cdot \bigl(0.75\cdot\text{timeline\_score} + 0.15\cdot\text{dmg\_norm} + 0.10\cdot\text{vision\_norm}\bigr),\ 1\Bigr).
\]

So **75%** comes from the timeline (gold/XP/CS/KDA/KP over the game), **15%** from end-of-game damage share, and **10%** from end-of-game vision.

#### MVP and ACE

- **MVP** = player with the highest OP Score on the **winning** team.
- **ACE** = player with the highest OP Score on the **losing** team.
