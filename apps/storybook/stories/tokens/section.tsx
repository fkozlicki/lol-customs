import type { ReactNode } from "react";

/** A group of tokens under a hairline, with a note on how to use them. */
export function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
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
