"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@v1/ui/button";
import { toast } from "@v1/ui/sonner";
import { useRef, useState } from "react";
import { useUser } from "@/components/auth/user-context";
import { RichTextEditor } from "@/components/forum/rich-text-editor";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";

interface CommentFormProps {
  postId: string;
  onCancel: () => void;
}

export function CommentForm({ postId, onCancel }: CommentFormProps) {
  const { profile, openSignInDialog } = useUser();
  const t = useScopedI18n("dashboard.pages.posts.comments");
  const [isEmpty, setIsEmpty] = useState(true);
  const contentRef = useRef<Record<string, unknown>>({});
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createComment = useMutation(
    trpc.forum.comments.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.forum.comments.list.queryOptions({ postId }),
        );
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  function handleEditorChange(json: Record<string, unknown>) {
    contentRef.current = json;
    const content = json as { content?: { type: string }[] };
    const hasContent =
      Array.isArray(content.content) &&
      content.content.some(
        (node) => node.type !== "paragraph" || Object.keys(node).length > 1,
      );
    setIsEmpty(!hasContent);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) {
      openSignInDialog();
      return;
    }
    if (isEmpty) return;
    createComment.mutate({ postId, content: contentRef.current });
  }

  if (!profile) {
    return (
      <div className="rounded-md border border-dashed border-border p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
            onClick={openSignInDialog}
          >
            {t("signIn")}
          </button>{" "}
          {t("signInSuffix")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <RichTextEditor
        onChange={handleEditorChange}
        placeholder={t("placeholder")}
        userId={profile.id}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isEmpty || createComment.isPending}
        >
          {createComment.isPending ? t("posting") : t("post")}
        </Button>
      </div>
    </form>
  );
}
