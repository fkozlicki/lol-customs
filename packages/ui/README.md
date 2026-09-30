# @v1/ui

Derby's design system: shadcn primitives, the recipes built on them, and the design tokens both depend
on. `apps/app` uses it; it does not add visual components of its own (ADR 0004).

## What belongs here

Two tiers, in two folders:

- **`src/components/`: primitives.** Anything that knows nothing about Derby: a button, a dialog, a
  table. Derby Sync uses a few of these too, so they stay neutral.
- **`src/recipes/`: recipes.** Derby's visual components: a rank tag, a win–loss record, a match card,
  a standings row, a page shell. A recipe knows the domain's shapes and words, and renders them from
  plain props.

A component's variants are a `cva` call inside its file, as shadcn's own `button.tsx` does. That call
is called *variants*; "recipe" names the component.

## Writing a recipe

A recipe takes plain props (strings, numbers, hrefs, callbacks) and renders. What it may not do:

- **Fetch or know a tRPC type.** No `@v1/api`, `@v1/supabase` or `@trpc/*`. Where a recipe needs a
  whole object, it declares the shape it draws beside itself — `MatchCardView`, `StandingsRowView`,
  `PostCardView` — and the app maps its data onto it (`toMatchCardView` in
  `apps/app/src/components/matches/match-view.ts`, and so on). The mapper is where formatting with
  `@v1/domain`, season-aware links and anything else worth a test go.
- **Read the URL or route.** No `nuqs`, no `next/navigation`. Take `value` and `onChange`, `open` and
  `onOpenChange`, an `href`, or the pathname's verdict (`active`).
- **Import the app.** No `@/…`; this package has no such alias, so a moved import fails typecheck
  instead of resolving against the wrong `src`.

Biome's `noRestrictedImports` enforces all of that for `src/**`. What a recipe may use: the primitives,
`@v1/game-assets` for champion data and asset URLs (ADR 0006), `next/image` (game art, ADR 0002),
`next/link` with the `href` passed in, `motion`, `date-fns`, `react-intersection-observer` and
`@tiptap/*`.

### Shape

One component per file, grouped by area (`auctions/`, `forum/`, `player/`, `player-picker/`, …); a
helper a recipe uses gets its own file beside it, and the view types for an area sit in one
`*-view.ts`. Three patterns keep a recipe plain when the screen around it is not:

- **Slots.** Where a recipe frames something the app owns — a TipTap editor, a container with its own
  mutations, a form the app validates — it takes it as a `ReactNode` (`editor`, `controls`,
  `reactions`, `poolEditor`). A form field it styles takes its input props (`titleInput`,
  `nicknameInput`), so react-hook-form's `register` spreads straight in and the app keeps the schema.
- **Words as props.** A recipe's own words come from its messages. Words that are the app's — nav
  labels, Hall of Fame titles — or that differ per screen come in as props: the player picker is worded
  one way by the draw and another by the auction setup, so it takes its labels.
- **Screen state stays, server state goes.** Which match card is open, the bid a captain is typing, a
  team name being edited: a recipe may hold these. Anything that outlives the screen, lives in the URL
  or reaches the server is the container's.

### Strings

A recipe's strings live in `src/recipes/messages/`: `en.ts`, and `pl.ts`, which must have the same keys
or typecheck fails. Keys are named after what they name (`match.mvp`), not after the page that first
showed them. A recipe reads them with next-intl — `useTranslations("match")`, and `useLocale()` for
date-fns and number formats — imported from `next-intl`, a peer dependency, so the package and the app
share one copy and one context. Messages are ICU: `{param}` as usual, an apostrophe right before `{`
starts quoted text, and React elements go through `t.rich`.

There is one runtime and one provider (ADR 0005). The app spreads these messages beside its own into
the dictionary its `NextIntlClientProvider` serves (`apps/app/src/i18n/messages.ts`), and Storybook
serves them alone. The spread is flat, so a new top-level key here must not reuse a name the app
already has; `compose` in that file makes a clash a compile error. For typed keys when this package is
checked on its own, `messages/app-config.d.ts` declares the recipes' part; nothing imports it, so it
never meets the app's declaration of the whole.

## Derby Sync

`apps/lcu` uses primitives only. It does not import `tokens.css`, so a recipe's `label-caps`, `num` or
domain colours would render unstyled there, silently, and it is a static export, where `next/image`'s
default loader does not work. Lint blocks `@v1/ui/recipes/*` inside `apps/lcu`. Anything promoted into
`components/` has to use only tokens Derby Sync defines too; check its `globals.css` before adding.

## Adding a primitive

Run the shadcn CLI from this package — `components.json` here points it at the right aliases and at
`src/styles/tokens.css`. `apps/app` has no config of its own on purpose: the only thing it would add
is shadcn's composed blocks, and Derby's recipes are written by hand.

The icon map in `components/icons` names icons after what they depict (`Gavel`, `Crown`, `Swords`),
because Derby Sync draws from the same set. `recipes/icons` spreads it and adds the Derby names on top
(`Leaderboard`, `Auction`), so a recipe or the app imports icons once.

**`empty`, `form`, `separator` and `tooltip` are here on purpose and nothing imports them.** They were kept
on the assumption that the app's hand-rolled versions would be replaced by them; that did not
happen. `empty` is centred, boxed and dashed, where Derby's empty states are left-aligned inline
notes, so adopting it would contradict DESIGN.md rule 7 rather than fix a drift. `tooltip` has no
candidate in the app at all. `separator` has exactly one — the rule in the editor toolbar. `form`
lost its last users when the sign-in and new-post forms became recipes that take react-hook-form's
`register` props, which keeps react-hook-form out of the recipes. They stay because a shadcn primitive
costs nothing to keep and one `npx shadcn add` to get back wrongly. Don't delete them as dead code
without reading this line first.

## Exports

One entry per file, as for the primitives (`"./button"`). Recipes resolve through a wildcard,
`@v1/ui/recipes/<path>` to `src/recipes/<path>.tsx`; a recipe module that is plain `.ts` — the view
types, the URL builders, the motion tokens — needs its own entry, because the wildcard only reaches
`.tsx`.

## Stories

This package has none. They live in `apps/storybook/stories`, as in Turborepo's design-system example,
and import this package through its exports like any other consumer: a story can only show what the
package lets the app use, and a component missing from `exports` fails there first. The folders mirror
`src/` — `components/` and `tokens.stories.tsx` form the *Design system* section, `recipes/` the
*Recipes* section — and a story names only its component (`title: "Matches/Match card"`); the section
is prepended. Stories take plain values: a recipe that needs a fixture gets a view-shaped one beside its
story (`match.fixtures.ts`), generated by the app's mapper from its router-shaped fixture, so the
numbers are ones a real card shows.

### Stories are tests

Every story runs as a test, in CI and with `bun run --cwd apps/storybook test:stories`: Vitest renders it
in Chromium through the same preview, once per locale and theme, runs its `play` function and checks the
result with axe. It fails on an axe violation, on a `console.error` (React swallows render errors in
Storybook and only logs them) and on rendering nothing. So a story is written to be tested:

- **Args, not constants.** The meta names its `component` and the story sets `args`, so Controls can
  change it and its docs page lists the props. A `render` that shows several states side by side is for
  comparing them, and still passes `args` through where it can.
- **Callbacks are `fn()`** from `storybook/test`: the Actions panel shows what the recipe called, and a
  `play` function can assert it.
- **Behaviour gets a `play` function.** Whatever a recipe does on its own — opening, toggling, clamping
  an amount, what Enter or Escape does — is clicked through with `canvas`, `userEvent` and `expect`.
  Find things by the words a reader sees, from `wordsFor(globals)` (`stories/words.ts`), so the test
  runs in every locale and checks the words as it goes.
- **A controlled recipe holds its state in the story**, in a small wrapper keyed by the args, so typing
  works in Storybook and in the tests alike (`useArgs` does not re-render a story under Vitest).
- **One component per story file**, named in the meta, so each gets its own docs page.
- **A story that opens on a viewport tells Chromatic too**, with `chromaticAt("phone")` from
  `stories/modes.ts`: the tests honour `globals.viewport`, but Chromatic snapshots at its own 1200 px.
- **An accessibility exception is per story**: one rule off in `parameters.a11y.config.rules`, with a
  comment saying why. A reason that recurs lives once in `stories/a11y.ts` (`OPEN_RADIX_MENU`).
- **Comments are the documentation.** The JSDoc above a component and above each story is its text on
  the component's docs page (autodocs).

The toolbar switches theme, locale and viewport (390 and 1280 px, the widths DESIGN.md judges a view
at). Chromatic publishes the Storybook and snapshots every story in both themes, from
`.github/workflows/chromatic.yml`. `test:stories:coverage` reports how much of this package the stories
exercise.

## Tokens

`src/styles/tokens.css` is the contract. These components name `bg-card`, `text-muted-foreground`,
`text-win`; a consumer that has not defined those tokens gets no utility, no build error and no
styles — so the tokens ship with the components rather than being re-declared per app. The
`dark`/`light`/`auto` variants are declared there too, so `dark:` follows the theme class on `<html>`.

Import it after Tailwind:

```css
@import "tailwindcss";
@import "@v1/ui/tokens.css";
@source "../path/to/packages/ui/src";
```

Two lines the consumer owns, and why they are not in this file:

- **`@import "tailwindcss"` stays with the consumer.** Tailwind's automatic class detection starts
  from the working directory of the build and skips `node_modules`, so it finds the consumer's own
  files and not this package's. `apps/storybook` turns it off with `source(none)` and names its two
  sources, this package and its `stories/`.
- **`@source` therefore points at this package**, relative to the stylesheet. Point it at the whole
  of `src`; a recipe added in a new subfolder otherwise loses its styles silently.

**The font tokens stay with the consumer too.** `--font-sans` and `--font-mono` name whatever typeface
the consumer wired up; Derby uses Geist. The `label-caps` and `num` utilities fall back to a system
stack, so a consumer that declares neither gets readable text rather than an unresolved variable.

See [DESIGN.md](../../DESIGN.md) for what the tokens mean and [CONTEXT.md](../../CONTEXT.md) for the
domain terms.
