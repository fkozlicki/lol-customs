"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "../components/button";

/** A link led nowhere: a post, a room or a player that does not exist. Offers the way home. */
export function NotFound({ homeHref }: { homeHref: string }) {
  const t = useTranslations("notFound");

  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="text-4xl font-semibold uppercase leading-none tracking-[-0.035em] sm:text-6xl">
        {t("title")}
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {t("description")}
      </p>
      <Button asChild variant="outline">
        <Link href={homeHref}>{t("home")}</Link>
      </Button>
    </section>
  );
}
