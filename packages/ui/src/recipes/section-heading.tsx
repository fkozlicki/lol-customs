import type { ReactNode } from "react";

/** Uppercase section title with a hairline above; the standard block heading below a page header. */
export function SectionHeading({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between pb-3">
      <h2 className="label-caps text-foreground">{children}</h2>
      {action}
    </div>
  );
}
