import Link from "next/link";
import { getScopedI18n } from "@/locales/server";
import { PATHS } from "./nav";

export async function MobileNav() {
  const t = await getScopedI18n("dashboard");

  return (
    <div className="sticky bottom-0 bg-background border-t border-border h-12 p-2 md:hidden">
      <div className="flex gap-4 h-full">
        {PATHS.map(({ path, label, Icon }) => (
          <Link
            key={path}
            href={path}
            className="flex-1 grid place-items-center"
          >
            <Icon className="size-4" />
            <span className="sr-only">{t(label)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
