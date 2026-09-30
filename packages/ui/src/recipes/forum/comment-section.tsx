"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "../../components/button";

interface CommentSectionProps {
  count: number;
  /** The comment form, while the reader is writing one. */
  composer: ReactNode | null;
  onCompose: () => void;
  /** The comments, as `CommentItem`s. */
  children: ReactNode;
}

/** The thread under a post: how many comments, a way to join in, and the comments. */
export function CommentSection({
  count,
  composer,
  onCompose,
  children,
}: CommentSectionProps) {
  const t = useTranslations("forum.comments");

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="label-caps text-foreground">{t("title", { count })}</h2>
        {!composer && (
          <Button variant="outline" size="sm" onClick={onCompose}>
            {t("joinConversation")}
          </Button>
        )}
      </div>

      {composer}

      {count === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noComments")}</p>
      ) : (
        <ol className="divide-y border-b">{children}</ol>
      )}
    </section>
  );
}
