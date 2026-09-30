"use client";

import { useTranslations } from "next-intl";

/** In place of the comment form for a signed-out reader. */
export function CommentSignInPrompt({ onSignIn }: { onSignIn: () => void }) {
  const t = useTranslations("forum.comments");

  return (
    <div className="rounded-md border border-dashed border-border p-4 text-center">
      <p className="text-sm text-muted-foreground">
        <button
          type="button"
          className="underline underline-offset-2 transition-colors hover:text-foreground"
          onClick={onSignIn}
        >
          {t("signIn")}
        </button>{" "}
        {t("signInSuffix")}
      </p>
    </div>
  );
}
