import Link from "next/link";
import { cn } from "../../utils/cn";

interface TabLinkProps {
  href: string;
  active: boolean;
  label: string;
  /** The tab's icon. */
  children: React.ReactNode;
}

/** One tab on the phone's bottom bar: an icon over its label, with a rule on top when current. */
export function TabLink({ href, active, label, children }: TabLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {active && (
        <span className="absolute inset-x-3 top-0 h-0.5 bg-foreground" />
      )}
      {children}
      <span className="max-w-full truncate px-1 font-mono text-[9px] uppercase tracking-[0.08em]">
        {label}
      </span>
    </Link>
  );
}
