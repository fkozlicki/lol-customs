interface PreferenceRowProps {
  label: string;
  /** The row's options, as `PreferenceOption`s. */
  children: React.ReactNode;
}

/** A labelled segmented control inside the account menu: theme, language. */
export function PreferenceRow({ label, children }: PreferenceRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="label-caps">{label}</span>
      <div className="flex border">{children}</div>
    </div>
  );
}
