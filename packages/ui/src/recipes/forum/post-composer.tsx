"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ComponentProps, FormEventHandler, ReactNode } from "react";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import { cn } from "../../utils/cn";
import { BackToPosts } from "./back-to-posts";

interface PostComposerProps {
  /** The title field's props, e.g. what react-hook-form's `register` returns. */
  titleInput: ComponentProps<"input">;
  /** Why the title will not do, once the form has been sent. */
  titleError?: string;
  /** The rich text editor for the body, which the app owns. */
  editor: ReactNode;
  pending: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  /** Where cancelling and going back lead. */
  backHref: string;
}

/** Writing a post: a title set large, the body, then cancel and publish. */
export function PostComposer({
  titleInput,
  titleError,
  editor,
  pending,
  onSubmit,
  backHref,
}: PostComposerProps) {
  const t = useTranslations("forum.composer");

  return (
    <>
      <BackToPosts href={backHref} />

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="space-y-2 border-b pb-6">
          <label
            htmlFor="post-title"
            className={cn("label-caps", titleError && "text-destructive")}
          >
            {t("titleLabel")}
          </label>
          <Input
            id="post-title"
            placeholder={t("titlePlaceholder")}
            aria-invalid={Boolean(titleError)}
            aria-describedby={titleError ? "post-title-error" : undefined}
            className="h-auto border-0 bg-transparent px-0 py-2 text-3xl font-semibold tracking-[-0.03em] shadow-none focus-visible:ring-0 sm:text-4xl md:text-4xl dark:bg-transparent"
            {...titleInput}
          />
          {titleError && (
            <p
              id="post-title-error"
              className="text-[0.8rem] font-medium text-destructive"
            >
              {titleError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <span className="label-caps">{t("contentLabel")}</span>
          {editor}
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-6">
          <Link
            href={backHref}
            className="label-caps underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("cancel")}
          </Link>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? t("publishing") : t("publish")}
          </Button>
        </div>
      </form>
    </>
  );
}
