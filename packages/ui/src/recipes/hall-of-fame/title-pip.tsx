import { cn } from "../../utils/cn";

/** One held title: filled for best, outlined for worst. */
export function TitlePip({ filled = false }: { filled?: boolean }) {
  return (
    <span
      className={cn(
        "size-2",
        filled ? "bg-foreground" : "border border-foreground",
      )}
    />
  );
}
