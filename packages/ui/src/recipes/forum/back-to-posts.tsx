"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icons } from "../../components/icons";

/** Back to the forum, above a post and the new-post form. */
export function BackToPosts({ href }: { href: string }) {
  const t = useTranslations("forum");

  return (
    <Link
      href={href}
      className="label-caps inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
    >
      <Icons.ChevronLeft className="size-3.5" />
      {t("backToPosts")}
    </Link>
  );
}
