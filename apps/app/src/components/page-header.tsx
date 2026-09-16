interface PageHeaderProps {
  title: string;
  description?: string;
  /** Small uppercase line above the title, e.g. the season. */
  eyebrow?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  children,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow && <p className="label-caps">{eyebrow}</p>}
        <h1 className="text-4xl font-semibold uppercase leading-none tracking-[-0.035em] sm:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </header>
  );
}
