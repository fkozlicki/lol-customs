"use client";

import { DropdownMenuItem } from "../../components/dropdown-menu";
import { cn } from "../../utils/cn";

interface PreferenceOptionProps {
  active: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}

/** One option of a segmented control; a menu item so arrow keys reach it, but selecting keeps the menu open. */
export function PreferenceOption({
  active,
  onSelect,
  children,
}: PreferenceOptionProps) {
  return (
    <DropdownMenuItem
      aria-checked={active}
      role="menuitemradio"
      onSelect={(event) => {
        event.preventDefault();
        onSelect();
      }}
      className={cn(
        "border-r px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] last:border-r-0",
        active
          ? "bg-foreground text-background focus:bg-foreground focus:text-background"
          : "text-muted-foreground",
      )}
    >
      {children}
    </DropdownMenuItem>
  );
}
