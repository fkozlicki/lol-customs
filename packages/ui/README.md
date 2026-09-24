# @v1/ui

Neutral primitives — shadcn/ui components plus the Derby design tokens they depend on.

## Adding a primitive

Run the shadcn CLI from this package — `components.json` here points it at the right aliases and at
`src/styles/tokens.css`. `apps/app` has no config of its own on purpose: the only thing it would add
is shadcn's composed blocks, and Derby's compositions are written by hand.

## What belongs here

Anything that knows nothing about Derby: a button, a dialog, a table. Components that encode the
domain — a rank tag, a match card, a standings row — live in `apps/app/src/components/`, following
shadcn's own split: `add button` lands in the package, the composed thing that uses it lands in the
app.

The icon map names icons after what they depict (`Gavel`, `Crown`, `Swords`). The mapping from a
Derby term to a picture is in `apps/app/src/components/derby-icons.ts`.

## Tokens

`src/styles/tokens.css` is the contract. These components name `bg-card`, `text-muted-foreground`,
`text-win`; a consumer that has not defined those tokens gets no utility, no build error and no
styles — so the tokens ship with the components rather than being re-declared per app.

Import it after Tailwind:

```css
@import "tailwindcss";
@import "@v1/ui/tokens.css";
@source "../path/to/packages/ui/src/**/*.{ts,tsx}";
```

Two lines the consumer owns, and why they are not in this file:

- **`@import "tailwindcss"` stays in the app.** Tailwind v4 anchors automatic class detection at the
  directory of the file holding that import, and skips `node_modules`. Moving it here would make the
  app's own `src/` invisible unless every source were re-declared.
- **`@source` therefore points back at this package**, because of the same `node_modules` rule. Keep
  it recursive; a component added in a subdirectory otherwise loses its styles silently.

- **The font tokens stay in the app too.** `--font-sans` and `--font-mono` name whatever typeface the
  consumer wired up; Derby uses Geist. The `label-caps` and `num` utilities fall back to a system
  stack, so a consumer that declares neither gets readable text rather than an unresolved variable.

**Derby Sync (`apps/lcu`) does not import this file.** It has its own look — indigo on navy, rounded
corners, dark only — and keeps its own stylesheet. It uses a handful of components from here, none of
which reference a token it has not defined. Anything promoted into this package that uses
`label-caps`, `num` or a domain colour would render unstyled there, silently, so check before adding.

See [DESIGN.md](../../DESIGN.md) for what the tokens mean and [CONTEXT.md](../../CONTEXT.md) for the
domain terms.
