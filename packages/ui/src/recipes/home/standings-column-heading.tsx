import { cn } from "../../utils/cn";

interface StandingsColumnHeadingProps {
  className?: string;
  children: React.ReactNode;
}

/** A column's `label-caps` heading in the standings table. */
export function StandingsColumnHeading({
  className,
  children,
}: StandingsColumnHeadingProps) {
  return (
    <th
      className={cn(
        "label-caps h-10 px-3 font-normal first:pl-4 sm:first:pl-0",
        className,
      )}
    >
      {children}
    </th>
  );
}
