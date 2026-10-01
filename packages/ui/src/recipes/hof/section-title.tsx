/**
 * The heading above a Hall of Fame section. Not `SectionHeading`, which is the `label-caps` block
 * heading — this is an entry title, one step down from the page title.
 */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="pb-3 text-2xl font-semibold uppercase leading-none tracking-[-0.03em] sm:text-3xl">
      {children}
    </h2>
  );
}
