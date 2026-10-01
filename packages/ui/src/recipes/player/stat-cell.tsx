import { cn } from "../../utils/cn";

interface StatCellProps {
  label: string;
  className?: string;
  children: React.ReactNode;
}

/** One cell of the profile's stat grid: a label on top, the figures at the bottom. */
export function StatCell({ label, className, children }: StatCellProps) {
  return (
    <div
      className={cn(
        "flex min-h-28 flex-col justify-between gap-3 border-r border-b p-4",
        className,
      )}
    >
      <span className="label-caps">{label}</span>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}
