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

OP Score to **wynik gry w skali 0–10** dla każdego uczestnika meczu. Obliczany jest na dwa sposoby w zależności od tego, czy dostępne są **dane timeline**.

### Gdy brak lub nieprawidłowy timeline (fallback)

Wszystko opiera się wyłącznie na **statystykach końcowych**. Wszystkie metryki są normalizowane do \([0, 1]\) przez **maksimum w meczu** (najlepsza wartość w meczu = 1).

1. **Współczynnik KDA**  
   \( \text{KDA} = \frac{K + A}{\max(D, 1)} \).  
   Normalizacja: \( \text{kda\_norm} = \min\bigl(1,\ \text{KDA} / \max_{\text{mecz}}(\text{KDA})\bigr) \).

2. **Udział w zabójstwach (KP)**  
   \( \text{KP} = \frac{K + A}{\text{suma zabójstw drużyny}} \).  
   Już w \([0,1]\): \( \text{kp\_norm} = \min(1, \text{KP}) \).

3. **Udział w obrażeniach**  
   Udział = twoje obrażenia do bohaterów / suma obrażeń drużyny do bohaterów.  
   Normalizacja przez maks. udział w meczu: \( \text{dmg\_norm} = \min(1,\ \text{udział} / \max_{\text{mecz}}(\text{udział}) \).

4. **CS na minutę**  
   \( \text{CS/min} = \frac{\text{suma CS}}{\text{czas gry w minutach}} \).  
   Normalizacja: \( \text{cs\_norm} = \min(1,\ \text{CS/min} / \max_{\text{mecz}}(\text{CS/min}) \).

5. **Punkty wizji**  
   Normalizacja: \( \text{vision\_norm} = \min(1,\ \text{vision} / \max_{\text{mecz}}(\text{vision}) \).

**OP Score (fallback):**

\[
\text{OP Score} = \text{round}\Bigl(10 \cdot \bigl(0{,}25\cdot\text{kda\_norm} + 0{,}25\cdot\text{kp\_norm} + 0{,}25\cdot\text{dmg\_norm} + 0{,}15\cdot\text{cs\_norm} + 0{,}10\cdot\text{vision\_norm}\bigr),\ 1\Bigr).
\]

Wynik jest z przedziału \([0, 10]\) z jednym miejscem po przecinku.

---

### Gdy timeline jest dostępny (co 5 minut, uwzględnienie roli)

Mecz jest dzielony na **okna 5-minutowe** (5, 10, 15, … minut). Dla każdego takiego momentu bierzemy klatkę timeline najbliższą temu czasowi i liczymy **wynik snapshotu** z danych dostępnych wtedy. Następnie uśredniamy te snapshoty i łączymy z końcowym udziałem w obrażeniach i wizji.

#### Snapshot co 5 minut

W każdym momencie 5-min mamy dla gracza:

- **Gold, XP, CS** (miniony + dżungla) z tej klatki.
- **K, D, A** oraz **zabójstwa drużyny** ze wszystkich zdarzeń do tego czasu → współczynnik KDA i KP w tym momencie.

Normalizacja:

- **Gold, XP, CS** są normalizowane **w ramach roli** (np. junglerzy do junglerów, lanerzy do lanerów), żeby żadna rola nie była karana za inny styl farmienia. Dla każdego (czas, rola) bierzemy max gold, max XP, max CS w tej roli i ustawiamy:
  - \( \text{gold\_norm} = \min(1,\ \text{gold} / \max_{\text{ta sama rola}}(\text{gold}) \),
  - analogicznie **xp_norm** i **cs_norm**.
- **KDA** i **KP** w tym momencie są normalizowane przez **maksimum w meczu** w tym momencie (wspólne dla wszystkich ról).

Wynik snapshotu dla danego okna (średnia z pięciu składowych 0–1):

\[
\text{snapshot} = \frac{\text{gold\_norm} + \text{xp\_norm} + \text{cs\_norm} + \text{kda\_norm} + \text{kp\_norm}}{5}.
\]

#### Wynik timeline (średnia po oknach 5-min)

\[
\text{timeline\_score} = \frac{1}{N} \sum_{\text{okna 5-min}} \text{snapshot},
\]

gdzie \( N \) to liczba okien 5-minutowych w meczu. Zatem \( \text{timeline\_score} \in [0, 1] \).

#### Końcowe obrażenia i wizja

- **dmg_norm** = twój udział w obrażeniach (twoje / drużyny) podzielony przez maksymalny udział w meczu, z ograniczeniem do 1.
- **vision_norm** = twoje punkty wizji podzielone przez maksymalne punkty wizji w meczu, z ograniczeniem do 1.

#### Końcowy OP Score (ścieżka z timeline)

\[
\text{OP Score} = \text{round}\Bigl(10 \cdot \bigl(0{,}75\cdot\text{timeline\_score} + 0{,}15\cdot\text{dmg\_norm} + 0{,}10\cdot\text{vision\_norm}\bigr),\ 1\Bigr).
\]

Czyli **75%** pochodzi z timeline (gold/XP/CS/KDA/KP w trakcie meczu), **15%** z końcowego udziału w obrażeniach, **10%** z końcowej wizji.

#### MVP i ACE

- **MVP** = gracz z najwyższym OP Score w **wygranej** drużynie.
- **ACE** = gracz z najwyższym OP Score w **przegranej** drużynie.
