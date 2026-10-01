"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PostComposer } from "@v1/ui/recipes/forum/post-composer";
import { toast } from "@v1/ui/sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUser } from "@/components/auth/user-context";
import { useTRPC } from "@/trpc/react";
import { RichTextEditor } from "./rich-text-editor";

/** Writing a post; a signed-out visitor is sent back to the forum and asked to sign in. */
export function NewPostForm() {
  const { profile, isLoading, openSignInDialog } = useUser();
  const t = useTranslations("dashboard.pages.posts.newPostPage");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().trim().min(1, t("titleRequired")).max(200),
        content: z.record(z.string(), z.unknown()),
      }),
    [t],
  );
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", content: {} },
  });

  useEffect(() => {
    if (!isLoading && !profile) {
      openSignInDialog();
      router.replace("/posts");
    }
  }, [isLoading, profile, openSignInDialog, router]);

  const createPost = useMutation(
    trpc.forum.posts.create.mutationOptions({
      onSuccess: (post) => {
        queryClient.invalidateQueries(trpc.forum.posts.list.queryOptions({}));
        toast.success(t("toast.created"));
        router.push(`/posts/${post.id}`);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  if (isLoading || !profile) return null;

  return (
    <PostComposer
      titleInput={form.register("title")}
      titleError={form.formState.errors.title?.message}
      editor={
        <RichTextEditor
          onChange={(json) => form.setValue("content", json)}
          placeholder={t("contentPlaceholder")}
          userId={profile.id}
        />
      }
      pending={createPost.isPending}
      onSubmit={form.handleSubmit((values) => createPost.mutate(values))}
      backHref="/posts"
    />
  );
}
