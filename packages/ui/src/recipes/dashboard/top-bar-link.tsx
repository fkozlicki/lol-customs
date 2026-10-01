import Link from "next/link";
import { cn } from "../../utils/cn";
import { ActiveMarker } from "./active-marker";

interface TopBarLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
}

/** A destination in the top bar, underlined while it is the current page. */
export function TopBarLink({ href, active, children }: TopBarLinkProps) {
  return (
    <Link
      href={href}
      prefetch={true}
      className={cn(
        "relative flex items-center text-xs font-medium uppercase tracking-[0.08em] transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {children}
      {active && <ActiveMarker />}
    </Link>
  );
}
