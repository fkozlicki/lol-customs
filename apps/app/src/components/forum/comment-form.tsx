"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CommentComposer } from "@v1/ui/recipes/forum/comment-composer";
import { CommentSignInPrompt } from "@v1/ui/recipes/forum/comment-sign-in-prompt";
import { toast } from "@v1/ui/sonner";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useUser } from "@/components/auth/user-context";
import { useTRPC } from "@/trpc/react";
import { RichTextEditor, type RichTextEditorHandle } from "./rich-text-editor";

interface CommentFormProps {
  postId: string;
  onCancel: () => void;
}

/** TipTap's empty document is a single bare paragraph; anything else has something in it. */
function hasContent(json: Record<string, unknown>) {
  const { content } = json as { content?: Record<string, unknown>[] };
  return (
    Array.isArray(content) &&
    content.some(
      (node) => node.type !== "paragraph" || Object.keys(node).length > 1,
    )
  );
}

/** Writing a comment under a post; a signed-out reader is asked to sign in instead. */
export function CommentForm({ postId, onCancel }: CommentFormProps) {
  const { profile, openSignInDialog } = useUser();
  const t = useTranslations("dashboard.pages.posts.comments");
  const [isEmpty, setIsEmpty] = useState(true);
  const contentRef = useRef<Record<string, unknown>>({});
  const editorRef = useRef<RichTextEditorHandle>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createComment = useMutation(
    trpc.forum.comments.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.forum.comments.list.queryOptions({ postId }),
        );
        editorRef.current?.clearContent();
        contentRef.current = {};
        setIsEmpty(true);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  if (!profile) return <CommentSignInPrompt onSignIn={openSignInDialog} />;

  return (
    <CommentComposer
      editor={
        <RichTextEditor
          ref={editorRef}
          onChange={(json) => {
            contentRef.current = json;
            setIsEmpty(!hasContent(json));
          }}
          placeholder={t("placeholder")}
          userId={profile.id}
        />
      }
      canSubmit={!isEmpty}
      pending={createComment.isPending}
      onSubmit={() =>
        createComment.mutate({ postId, content: contentRef.current })
      }
      onCancel={onCancel}
    />
  );
}
