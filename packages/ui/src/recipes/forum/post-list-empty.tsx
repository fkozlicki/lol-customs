"use client";

import { useTranslations } from "next-intl";

/** A forum with no posts yet, and the way to write the first, which the app passes as `action`. */
export function PostListEmpty({ action }: { action?: React.ReactNode }) {
  const t = useTranslations("forum");

  return (
    <div className="flex flex-col items-start gap-4 border-t pt-10">
      <p className="text-xl font-semibold tracking-[-0.02em]">{t("noPosts")}</p>
      {action}
    </div>
  );
}
