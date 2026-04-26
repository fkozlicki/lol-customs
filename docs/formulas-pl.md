# Dokumentacja formuł

## Formuła rankingu (leaderboard)

Ranking używa **jednego ratingu** na gracza. Po każdej meczu 5v5 rating każdego uczestnika jest aktualizowany w stylu Elo z uwzględnieniem wyniku meczu i gry (**zero-sum** względem 10 graczy w tym meczu — brak długoterminowej inflacji).

### Stałe

- **K** = 32 (maksymalna zmiana ratingu na mecz; faktyczna zmiana jest ograniczona do ±24).
- **Waga wygranej** = 0,65 (65% „wyniku rzeczywistego” z wygranej/przegranej, 35% z gry).
- **Skala** = 400 (skala Elo dla wyniku oczekiwanego).

### Krok 1: Wynik oczekiwany (na drużynę)

Dla każdej drużyny wynik oczekiwany to standardowe prawdopodobieństwo Elo wygranej z drugą drużyną na podstawie średniego ratingu:

- \( \bar{R}_{\text{my}} \) = średni rating 5 graczy twojej drużyny (przed meczem).
- \( \bar{R}_{\text{przeciwnicy}} \) = średni rating 5 graczy drużyny przeciwnej.

Wówczas:

\[
E = \frac{1}{1 + 10^{(\bar{R}_{\text{przeciwnicy}} - \bar{R}_{\text{my}})/400}}
\]

Czyli \( E \in (0, 1) \). To samo \( E \) obowiązuje wszystkich 5 graczy twojej drużyny. Suma wyników oczekiwanych 10 graczy wynosi 5 (każda drużyna „dzieli” jeden oczekiwany wynik między dwie drużyny).

### Krok 2: Surowy wynik rzeczywisty (na gracza)

Dla każdego gracza w meczu:

- **Gdy brak OP score** (np. brak timeline):  
  \( a = 1 \), jeśli drużyna wygrała, \( a = 0 \), jeśli przegrała.

- **Gdy OP score jest** (0–10):  
  \[
  a = 0{,}65 \cdot \mathbb{1}_{\text{wygrana}} + 0{,}35 \cdot \frac{\text{op\_score}}{10}
  \]  
  przy \( \text{op\_score} \) ograniczonym do \([0, 10]\). Zatem \( a \in [0, 1]\).

### Krok 3: Skalowanie zero-sum

Niech \( a_i \) oznacza surowy wynik gracza \( i \) (\( i = 1..10 \)) oraz

\[
S = \sum_{i=1}^{10} a_i.
\]

- Jeśli \( S = 0 \): ustaw skalowany wynik \( \tilde{a}_i = 0{,}5 \) dla każdego gracza.
- Jeśli \( S > 0 \):  
  \[
  \tilde{a}_i = a_i \cdot \frac{5}{S}.
  \]

Wtedy \( \sum_{i=1}^{10} \tilde{a}_i = 5 \), czyli łączny „wynik rzeczywisty” w meczu równa się łącznemu „oczekiwanemu”, a suma zmian ratingu dla 10 graczy wynosi zero.

### Krok 4: Aktualizacja ratingu (na gracza)

Dla każdego gracza, przy wyniku oczekiwanym drużyny \( E \) i jego skalowanym wyniku \( \tilde{a} \):

\[
\Delta = \text{round}\Bigl(\text{clamp}\bigl(32 \cdot (\tilde{a} - E),\ -24,\ 24\bigr)\Bigr),
\]

\[
\text{rating}_{\text{nowy}} = \text{rating}_{\text{stary}} + \Delta.
\]

Zmiana jest więc ograniczona do ±24 punktów na mecz.

---

## Formuła OP Score

OP Score to wynik gry **w skali 0–10** dla każdego uczestnika meczu, przechowywany jako `numeric(5, 3)` — UI pokazuje jedno miejsce po przecinku, a ranking oraz wybór MVP/ACE używają pełnych trzech miejsc.

Wynik to **ważona suma czterech filarów**, każdy w \([0, 1]\):

- **Walka (C)** — wpływ na teamfighty, obrażenia, udział w zabójstwach, „smart KDA”.
- **Ekonomia (E)** — zdobyte złoto i CS/min, normalizowane **w obrębie tej samej roli**.
- **Utility (U)** — wizja, crowd control, tankowanie / mitygacja, obrażenia do struktur.
- **Timeline (T)** — progresja ważona czasem z kotwicą na końcu meczu. `T` jest pomijane w ścieżce fallback (gdy brak klatek timeline).

Normalizacje używają wartości **w obrębie meczu**. Tam gdzie mianownik mógłby być zerem, używamy niewielkiego floora, żeby niezerowy zawodnik pozostał na szczycie swojego filaru. Każdy składnik jest ograniczony do \([0, 1]\).

### Cztery filary

Niech `duration_min = duration_sec / 60` i dla gracza z drużyny `t` niech `team_dmg`, `team_taken`, `team_mitig`, `team_kills` oznaczają sumę po 5 kolegach. Dla każdego udziału dzielimy przez wartość drużyny i obcinamy do \([0, 1]\).

#### Walka

Maksymalna liczba zabójstw w meczu \(\max_{\text{mecz}} K\) (minimum 1) skaluje surowe zabójstwa obok udziałów drużynowych:

\[
C = 0{,}32 \cdot \operatorname{clip}\!\left(\tfrac{\text{dmg\_share}}{\max_{\text{mecz}}\text{dmg\_share}}\right)
  + 0{,}28 \cdot \operatorname{clip}\!\left(\tfrac{K + A}{\text{team\_kills}}\right)
  + 0{,}22 \cdot \operatorname{clip}\!\left(\tfrac{(K + 0{,}75 A)/\max(D, 1)}{\max_{\text{mecz}}(\cdot)}\right)
  + 0{,}18 \cdot \operatorname{clip}\!\left(\tfrac{K}{\max_{\text{mecz}} K}\right).
\]

#### Ekonomia (uczciwa rolowo)

Każdy gracz trafia do koszyka roli (niżej). Dla `(mecz, rola)` bierzemy maksimum roli dla złota i CS/min.

\[
E = 0{,}55 \cdot \operatorname{clip}\!\left(\tfrac{\text{gold\_earned}}{\max_{\text{rola}}(\text{gold\_earned})}\right)
  + 0{,}45 \cdot \operatorname{clip}\!\left(\tfrac{\text{CS/min}}{\max_{\text{rola}}(\text{CS/min})}\right).
\]

#### Utility

\[
U = 0{,}38 \cdot \operatorname{clip}\!\left(\tfrac{\text{vision/min}}{\max_{\text{mecz}}(\cdot)}\right)
  + 0{,}22 \cdot \operatorname{clip}\!\left(\tfrac{\text{time\_ccing\_others}}{\max_{\text{mecz}}(\cdot)}\right)
  + 0{,}25 \cdot \operatorname{clip}\!\left(\tfrac{\max(\text{dmg\_taken\_share},\ \text{self\_mitig\_share})}{\max_{\text{mecz}}(\cdot)}\right)
  + 0{,}15 \cdot \operatorname{clip}\!\left(\tfrac{\text{turret\_kills} + \text{inhibitor\_kills}}{\max_{\text{mecz}}(\cdot)}\right).
\]

#### Timeline

Snapshoty przy `t = cadence, 2·cadence, …` oraz jeden dodatkowy zakotwiczony na `t = duration_sec` (koniec gry). `cadence = 300s` na Summoner's Rift i `180s` na ARAM (`map_id = 12` lub kolejka 100 / 450 / 900 / 920).

Dla każdego snapshotu bierzemy najbliższą klatkę timeline i obliczamy:

- `eco_snap = (gold_role_norm + xp_role_norm + cs_role_norm) / 3` z maksami roli per-snapshot.
- `combat_snap = (kda_norm + kp_norm) / 2` z eventów kumulatywnych do `target_ts`, normalizowane globalnym maksem per-snapshot.
- `snap = 0,55 · eco_snap + 0,45 · combat_snap`.

Późniejsze snapshoty ważą więcej, tak aby kotwica końcowa dominowała:

\[
w(t) = 0{,}5 + \tfrac{t}{\text{duration\_sec}},\qquad
T = \tfrac{\sum_i w_i \cdot \text{snap}_i}{\sum_i w_i}.
\]

`w(wczesne) ≈ 0,5…1,0` rośnie liniowo do `w(koniec) = 1,5`, więc finalny snapshot liczy się mniej więcej 3× bardziej niż otwarcie — bez zupełnego dominowania progresji.

### Koszyki ról

Efektywny koszyk `_op_effective_role_bucket` (SQL):

1. **Summoner's Rift + dokładnie 10 uczestników** (`matches.map_id = 11` i 10 wierszy w `match_participants`): stałe **miejsce w lobby** z Riot `participantId` (kolejność miejsc w customie 5v5): id **1–5** i **6–10** → każda piątka **TOP → JUNGLE → MID → CARRY → SUPPORT**. Gdy brak `participant_id` lub poza 1–10 — heurystyka Riot poniżej.
2. **Dokładnie 10 graczy, ale nie SR** (inny `map_id`): **UNKNOWN** dla wszystkich.
3. **Pozostałe przypadki**: heurystyka Riot z `role` / `lane` przez `_op_role_bucket` — tiebreaker CS dla BOTTOM, próg neutralnych minionów dla jungle.

| Reguła (fallback `_op_role_bucket`) | Koszyk |
|--------|--------|
| `role = 'DUO_SUPPORT'` | SUPPORT |
| `role = 'DUO_CARRY'` | CARRY |
| `lane = 'JUNGLE'` lub `neutral_minions >= 60` | JUNGLE |
| `lane = 'BOTTOM'` i `minions < 50` | SUPPORT |
| `lane = 'BOTTOM'` i `minions >= 50` | CARRY |
| `lane = 'MIDDLE'` | MID |
| `lane = 'TOP'` | TOP |
| w przeciwnym razie | UNKNOWN |

### Wagi filarów zależne od roli (suma = 1 na rolę)

| Rola | w_C | w_E | w_U | w_T |
|------|-----|-----|-----|-----|
| CARRY   | 0{,}42 | 0{,}25 | 0{,}10 | 0{,}23 |
| MID     | 0{,}42 | 0{,}23 | 0{,}12 | 0{,}23 |
| TOP     | 0{,}33 | 0{,}25 | 0{,}19 | 0{,}23 |
| JUNGLE  | 0{,}33 | 0{,}22 | 0{,}22 | 0{,}23 |
| SUPPORT | 0{,}25 | 0{,}12 | 0{,}40 | 0{,}23 |
| UNKNOWN | 0{,}35 | 0{,}25 | 0{,}17 | 0{,}23 |

`T` ma stałą wartość **0,23** we wszystkich rolach: progresja jest sygnałem pomocniczym, nie głównym. Wagi walki dla carry/mid są ograniczone do **0,42** dla `w_C`, żeby obrażenia i zabójstwa nadal dzieliły wynik z ekonomią, utility i timeline.

### Końcowy wynik

\[
\text{OP Score} = \operatorname{round}\!\left(10 \cdot \left(w_C\,C + w_E\,E + w_U\,U + w_T\,T\right),\ 3\right),
\]

zapisany jako `numeric(5, 3)`. UI zaokrągla do jednego miejsca dla wyświetlenia; ranking / MVP używa pełnej precyzji.

### Fallback (brak klatek timeline lub duration krótszy niż cadence)

`T` jest pominięte, a jego 0,23 jest rozdzielone proporcjonalnie między `C`, `E`, `U`:

| Rola | w_C | w_E | w_U |
|------|-----|-----|-----|
| CARRY   | 0{,}54 | 0{,}33 | 0{,}13 |
| MID     | 0{,}54 | 0{,}30 | 0{,}16 |
| TOP     | 0{,}43 | 0{,}32 | 0{,}25 |
| JUNGLE  | 0{,}43 | 0{,}29 | 0{,}28 |
| SUPPORT | 0{,}32 | 0{,}16 | 0{,}52 |
| UNKNOWN | 0{,}46 | 0{,}32 | 0{,}22 |

\[
\text{OP Score} = \operatorname{round}\!\left(10 \cdot \left(w_C\,C + w_E\,E + w_U\,U\right),\ 3\right).
\]

### MVP / ACE (deterministyczne)

W ramach podziału wygrana/przegrana:

1. `op_score DESC`
2. `(w_C · C + w_U · U) DESC` — wpływ walki + utility
3. `dmg_share DESC`
4. **`kills DESC`**
5. `vision_per_min DESC`
6. `participant_id ASC`

`MVP = rn 1` w drużynie wygrywającej, `ACE = rn 1` w drużynie przegrywającej. Po wyborze **wynik MVP w kolumnie `op_score` jest podbijany do co najmniej wyniku ACE** w tym meczu (`greatest(mvp, ace)`), żeby MVP nigdy nie miała niższego OP niż ACE.

Przy trzech miejscach po przecinku remisy są rzadkie; powyższe klucze dają ścisły porządek w obrębie każdej partycji.

### Dlaczego to jest lepsze niż stare 75 / 15 / 10

- **Wizja nie jest już stałym 10%.** Wkład wizji u carry to `w_U × 0,30 ≈ 3%`; u supporta `0,40 × 0,30 = 12%` — zgodnie z tym, na czym każdej roli faktycznie zależy.
- **Koniec gry liczy się pierwszorzędnie.** `C + E + U` stanowi 77% wyniku we wszystkich rolach (vs. 25% wcześniej) i korzysta ze statystyk, które wcześniej ignorowaliśmy (CC, tankowanie, obiektywy).
- **Timeline to progresja, nie cała historia.** 23% z wagą czasu i kotwicą końcową zamiast 75% płaskiej średniej, która gubiła ostatnie `duration % cadence` minut.
- **Uczciwość wobec ról.** Support może wygrać wizją / CC / tankowaniem; tank na mitygacji + CC; carry na obrażeniach + zabójstwach + złocie.

### Literatura / inspiracje

- OP.GG — [OP Score explained](https://help.op.gg/hc/en-us/articles/31088715328665-OP-Score-explained).
- LoL Tracker — [MVP Score explanation](https://www.lol-tracker.com/mvp-score-explanation) (explicit pillars).
- Spectral.gg — [MVP formula](https://spectral.gg/docs/mvp_formula) (role factors, late-game weighting).
- PandaSkill — [arXiv 2501.10049](https://arxiv.org/abs/2501.10049) (role-isolated modeling).
