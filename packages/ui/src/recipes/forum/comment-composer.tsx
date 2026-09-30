"use client";

import { useTranslations } from "next-intl";
import type { FormEvent, ReactNode } from "react";
import { Button } from "../../components/button";

interface CommentComposerProps {
  /** The rich text editor, which the app owns. */
  editor: ReactNode;
  canSubmit: boolean;
  pending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

/** Writing a comment: the editor, then cancel and post. */
export function CommentComposer({
  editor,
  canSubmit,
  pending,
  onSubmit,
  onCancel,
}: CommentComposerProps) {
  const t = useTranslations("forum.comments");

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {editor}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={!canSubmit || pending}>
          {pending ? t("posting") : t("post")}
        </Button>
      </div>
    </form>
  );
}
