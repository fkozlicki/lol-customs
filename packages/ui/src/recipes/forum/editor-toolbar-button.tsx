import type { ReactNode } from "react";
import { Button } from "../../components/button";
import { cn } from "../../utils/cn";

interface EditorToolbarButtonProps {
  label: string;
  /** The formatting it toggles is on where the cursor is. */
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** One button on the editor's toolbar, lit while its formatting applies. */
export function EditorToolbarButton({
  label,
  active,
  onClick,
  children,
}: EditorToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn("size-7", active && "bg-accent text-accent-foreground")}
    >
      {children}
    </Button>
  );
}
