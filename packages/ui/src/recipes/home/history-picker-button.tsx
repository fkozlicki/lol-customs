import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

/** One choice in the history picker: a match count, or live. */
export function HistoryPickerButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "num h-8 min-w-10 shrink-0 border-r px-2 text-xs uppercase transition-colors last:border-r-0",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
