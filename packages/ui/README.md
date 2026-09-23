# @v1/ui

Neutral primitives — shadcn/ui components plus the Derby design tokens they depend on.

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

The `@source` line is needed because Tailwind skips `node_modules` when detecting classes.

**Derby Sync (`apps/lcu`) does not import this file.** It has its own look — indigo on navy, rounded
corners, dark only — and keeps its own stylesheet. It uses a handful of components from here, none of
which reference a token it has not defined. Anything promoted into this package that uses
`label-caps`, `num` or a domain colour would render unstyled there, silently, so check before adding.

See [DESIGN.md](../../DESIGN.md) for what the tokens mean and [CONTEXT.md](../../CONTEXT.md) for the
domain terms.
