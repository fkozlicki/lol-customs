/**
 * The token contract, rendered.
 *
 * DESIGN.md describes these in prose; this is the same thing you can look at. Switch the theme in the
 * toolbar — light is paper, not inverted graphite, and the domain inks are deliberately not the same
 * colour in both themes.
 */
import type { Meta, StoryObj } from "@storybook/react";

/** The meta names the component; `titlePrefix` in `.storybook/main.ts` names the tier. */
const meta = {
  title: "Tokens",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t pt-6">
      <div className="space-y-1">
        <h2 className="label-caps">{title}</h2>
        {note ? (
          <p className="max-w-prose text-muted-foreground text-sm">{note}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** A swatch names the token, so a reader can copy the class rather than guess the hue. */
function Swatch({ token, className }: { token: string; className: string }) {
  return (
    <div className="space-y-2">
      <div className={`h-16 w-full border ${className}`} />
      <p className="num text-xs">{token}</p>
    </div>
  );
}

const surfaces = [
  ["background", "bg-background"],
  ["foreground", "bg-foreground"],
  ["card", "bg-card"],
  ["popover", "bg-popover"],
  ["muted", "bg-muted"],
  ["accent", "bg-accent"],
  ["secondary", "bg-secondary"],
  ["primary", "bg-primary"],
  ["destructive", "bg-destructive"],
  ["border", "bg-border"],
] as const;

const domain = [
  ["win", "bg-win"],
  ["loss", "bg-loss"],
  ["mvp", "bg-mvp"],
  ["mvp-surface", "bg-mvp-surface"],
  ["ace", "bg-ace"],
  ["ace-surface", "bg-ace-surface"],
] as const;

const charts = [
  ["chart-1", "bg-chart-1"],
  ["chart-2", "bg-chart-2"],
  ["chart-3", "bg-chart-3"],
  ["chart-4", "bg-chart-4"],
  ["chart-5", "bg-chart-5"],
] as const;

export const Tokens: StoryObj = {
  render: () => (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-10 pb-16">
      <header className="space-y-2">
        <p className="label-caps">Design system</p>
        <h1 className="text-4xl uppercase tracking-[-0.035em] sm:text-6xl">
          Tokens
        </h1>
        <p className="max-w-prose text-muted-foreground text-sm">
          Graphite and paper. The only colour in the app is the colour of a
          result.
        </p>
      </header>

      <Section
        title="Surfaces and text"
        note="No brand accent lives here. Everything structural is background, foreground, muted, border or card."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {surfaces.map(([token, className]) => (
            <Swatch key={token} token={token} className={className} />
          ))}
        </div>
      </Section>

      <Section
        title="Domain colours"
        note="Named after CONTEXT.md terms. The ink and the surface differ in light mode: ink has to read on paper, a surface has to carry dark text."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
          {domain.map(([token, className]) => (
            <Swatch key={token} token={token} className={className} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="bg-mvp-surface px-2 py-1 text-mvp-foreground label-caps">
            MVP
          </span>
          <span className="bg-ace-surface px-2 py-1 text-ace-foreground label-caps">
            Ace
          </span>
          <span className="num text-win">+18</span>
          <span className="num text-loss">-14</span>
        </div>
      </Section>

      <Section title="Charts" note="Recharts series, in token order.">
        <div className="grid grid-cols-5 gap-4">
          {charts.map(([token, className]) => (
            <Swatch key={token} token={token} className={className} />
          ))}
        </div>
      </Section>

      <Section
        title="Type scale"
        note="Prose and names in Geist Sans; every number and every label in Geist Mono."
      >
        <div className="space-y-4">
          <p className="text-4xl uppercase tracking-[-0.035em] sm:text-6xl">
            Page title
          </p>
          <p className="text-2xl tracking-[-0.02em] sm:text-3xl">Entry title</p>
          <p className="text-sm">
            Body copy. Derby is a scoreboard for a group of friends; the data is
            the decoration.
          </p>
          <p className="label-caps">label-caps — names the number below it</p>
          <p className="num text-2xl">1 482 · 12–3 · 4.21</p>
        </div>
      </Section>

      <Section
        title="Corners and motion"
        note="Every radius token is 0, so rounded-md renders square; a circle is explicit. One easing curve, 150–400 ms."
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid size-16 place-items-center rounded-lg border bg-card">
            <span className="num text-xs">rounded-lg</span>
          </div>
          <div className="grid size-16 place-items-center rounded-full border bg-card">
            <span className="num text-xs">full</span>
          </div>
          <div className="border p-4">
            <div className="size-8 bg-foreground transition-transform duration-300 ease-(--ease-derby) hover:translate-x-8" />
          </div>
        </div>
      </Section>
    </div>
  ),
};
