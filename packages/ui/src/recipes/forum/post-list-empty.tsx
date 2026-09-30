"use client";

import { useTranslations } from "next-intl";
import { NewPostButton } from "./new-post-button";

/** A forum with no posts yet, and the way to write the first. */
export function PostListEmpty({ onNewPost }: { onNewPost: () => void }) {
  const t = useTranslations("forum");

  return (
    <div className="flex flex-col items-start gap-4 border-t pt-10">
      <p className="text-xl font-semibold tracking-[-0.02em]">{t("noPosts")}</p>
      <NewPostButton onClick={onNewPost} />
    </div>
  );
}
