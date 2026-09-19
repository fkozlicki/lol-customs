"use client";

import { formatDistanceToNow } from "date-fns";
import { enUS, pl } from "date-fns/locale";
import { useCurrentLocale } from "@/locales/client";

/** "3 hours ago" in the viewer's language. */
export function RelativeTime({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const locale = useCurrentLocale();

  return (
    <time dateTime={date} className={className}>
      {formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: locale === "pl" ? pl : enUS,
      })}
    </time>
  );
}
