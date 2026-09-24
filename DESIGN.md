# Derby design

How `apps/app` looks and why. Read this before building a page or a component there; the desktop app
(`apps/lcu`) is not covered.

Derby is a scoreboard for a group of friends. The design is **graphite and paper**: an editorial
black-and-white surface where the only colour is the colour of a result. Nothing is rounded, nothing
loops, nothing slides. The data is the decoration.

## Rules

1. **Colour only ever carries domain meaning.** There is no brand accent. The only hues in the app are
   `win`, `loss`, `mvp` and `ace` — the terms in [CONTEXT.md](CONTEXT.md). Everything else is
   `background`, `foreground`, `muted`, `border` and `card`. A button is not blue because buttons are
   blue; a tag is not green because it is positive.
2. **Every colour comes from a token.** Tokens live in `packages/ui/src/styles/tokens.css` and are
   defined twice, for `:root` and `.dark`. A colour written anywhere else — a palette class, a hex, an
   `rgb()` — cannot follow the theme and is rejected by the check below.
3. **Dark is the reference.** It was designed first. Light is paper, not inverted graphite: warm
   off-white, never pure `#fff`. Check both before calling a view finished.
4. **Corners are sharp.** Every radius token is `0`, so `rounded-md` renders square. Circles are
   deliberate and explicit (`rounded-full`); avatars are square (`rounded-none`).
5. **Numbers are mono.** Every rating, score, record, price and count uses the `num` utility, so digits
   line up in a column. Prose and names stay in Geist Sans.
6. **Labels are uppercase mono.** Section headings, table headers and metadata use `label-caps`.
   A label names the number below it; it is not a sentence.
7. **Hairlines, not boxes.** Group with `border-t`, `divide-y` and whitespace. A card (`bg-card` with a
   border) is for something that is genuinely a separate object, like a match. Nested borders are how a
   page starts to look like a spreadsheet.
8. **Animate state changes and arriving data, nothing else.** 150–400 ms, one easing curve
   (`--ease-derby` / `EASE`), no loops, no scroll-triggered effects. `MotionProvider` sets
   `reducedMotion="user"`, so respect it rather than working around it.
9. **Every user-facing string is in both locales.** `apps/app/src/locales/en.ts` and `pl.ts`. A string
   typed into JSX is a bug in the Polish UI.
10. **Phones get the same content.** Columns collapse, type shrinks, data does not disappear. Anything
    dropped at `sm:` was probably not worth showing on desktop either.

## Vocabulary

**Colour tokens** — `background`, `foreground`, `card`, `muted` / `muted-foreground`, `border`,
`input`, `ring`, `primary`, `secondary`, `accent`, `destructive`, `chart-1…5`.

**Domain tokens** — `win`, `loss` for a side or an outcome; `mvp`, `ace` as ink on the page;
`mvp-surface` / `ace-surface` with `mvp-foreground` / `ace-foreground` for a filled badge. The ink and
the surface differ in light mode: ink has to be readable on paper, a surface has to carry dark text.

**Utilities** — `label-caps` (uppercase mono label), `num` (tabular mono digits), `ease-(--ease-derby)`.

**Motion** — `EASE`, `DURATION` (`fast` 0.15, `base` 0.25, `slow` 0.4, `count` 0.8) and `STAGGER` from
`@/utils/motion`. A local `transition` must pass `inherit: true` to keep the shared easing.

**Components** — `PageHeader` (eyebrow, title, description, actions) opens every page;
`PageHeaderSkeleton` stands in while it loads. `SectionHeading` is the block heading below it.
Shared primitives come from `@v1/ui/*`.

**Storybook** — `bun dev:storybook`. Two sections: *Design system* for the tokens and the shared
primitives, *App* for the Derby compositions. The toolbar switches theme and locale, so rules 3 and 9
are one click away instead of a rebuild. Everything this file describes in prose is under
*Design system → Tokens*.

**Page shell** — `mx-auto w-full max-w-6xl space-y-10 px-4 pt-10 pb-16 sm:pt-16`. Reading views narrow
the measure (`max-w-4xl` for the forum list, `max-w-3xl` for a post); the auction room widens to
`max-w-[1500px]`.

**Type scale** — page title `text-4xl sm:text-6xl uppercase tracking-[-0.035em]`; entry title
`text-2xl sm:text-3xl tracking-[-0.02em]`; body `text-sm`; label `label-caps`; number `num`.

## Anti-patterns

| Instead of | Do this | Why |
| --- | --- | --- |
| `text-green-500` for something positive | `text-foreground` with a filled icon | Green means nothing here; only results get colour |
| `bg-black/40`, `text-white` | `bg-foreground/60`, `text-background` | Raw black and white break one of the two themes |
| A card around every block | `border-t` and whitespace | Boxes inside boxes read as a spreadsheet |
| `rounded-lg` added for softness | nothing | Radius tokens are `0`; the class is a no-op that misleads the next reader |
| A number in Geist Sans | `num` | Proportional digits jitter between rows |
| A skeleton of generic grey blocks | a skeleton shaped like the real view | Otherwise the layout visibly jumps when data lands |
| A spinner while data loads | the matching skeleton | The page should already show its shape |
| An animation that loops or fires on scroll | an animation on a state change | Motion here marks a change, it does not decorate |
| A new hue for a new feature | an existing token | Adding a hue redefines what colour means in the app |

## Judging a view

Run these against a screenshot of the finished view — in both themes, at 390 px and 1280 px.

1. **Squint.** Is the strongest thing on screen the most important number? On a ladder page that is the
   standings; on a match card it is the result and the score.
2. **Count the hues.** Anything other than win, loss, MVP and ACE is a bug.
3. **Hide the data.** If the skeleton were shown instead, would the page be roughly the same shape?
4. **Read the labels.** Every number should have a `label-caps` line telling you what it is, in both
   languages, without a tooltip.
5. **Follow one column of numbers down the page.** The digits should line up. If they drift, `num` is
   missing.
6. **Flip the theme.** Contrast and meaning must survive. Text over a coloured surface is the usual
   casualty.
7. **Turn on reduced motion.** Everything must still arrive and be readable.
8. **Shrink to 390 px.** Nothing may scroll sideways and no data may be dropped.

## Accepted exceptions

These break a rule on purpose; extending them needs a reason in the PR.

- **The podium count-up** runs 0.8 s, longer than the 400 ms ceiling. It is the one "wow" moment on the
  home page and reads as counting, not as a transition.
- **The live dot** in the auction list and the connection badge pulses in a loop, because the loop *is*
  the signal that the room is live.
- **Skeletons** pulse: `Skeleton` in `@v1/ui` is shared with the desktop app.
- **Toasts** use Sonner's `richColors`, so success and error carry a hue outside the domain palette.

## The check

`apps/app/scripts/check-design.ts` runs as part of `bun lint` (and therefore in CI). It reads every
`.ts`, `.tsx` and `.css` file under `apps/app/src` and fails on:

- a Tailwind palette class (`bg-red-500`, `text-slate-400`, …),
- a raw `black` or `white` utility,
- a literal colour value — hex, `rgb()`, `hsl()` or `oklch()` — outside the token stylesheet.

It is a grep, not a design review: it catches the colour rules only. If a line is a false positive, put
`design-check-ignore` in a comment on that line and say why.
