"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@v1/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@v1/ui/form";
import { Icons } from "@v1/ui/icons";
import { Input } from "@v1/ui/input";
import { toast } from "@v1/ui/sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUser } from "@/components/auth/user-context";
import { RichTextEditor } from "@/components/forum/rich-text-editor";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.record(z.string(), z.unknown()).default({}),
});

type FormValues = z.infer<typeof schema>;

export default function NewPostPage() {
  const { profile, isLoading, openSignInDialog } = useUser();
  const t = useScopedI18n("dashboard.pages.posts");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<FormValues>({
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
        toast.success(t("newPostPage.toast.created"));
        router.push(`/posts/${post.id}`);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  function onSubmit(values: FormValues) {
    createPost.mutate(values);
  }

  if (isLoading || !profile) return null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 pt-10 pb-16 sm:pt-16">
      <Link
        href="/posts"
        className="label-caps inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
      >
        <Icons.ChevronLeft className="size-3.5" />
        {t("backToPosts")}
      </Link>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="space-y-2 border-b pb-6">
                <FormLabel className="label-caps">
                  {t("newPostPage.titleLabel")}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("newPostPage.titlePlaceholder")}
                    className="h-auto border-0 bg-transparent px-0 py-2 text-3xl font-semibold tracking-[-0.03em] shadow-none focus-visible:ring-0 sm:text-4xl md:text-4xl dark:bg-transparent"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="label-caps">
                  {t("newPostPage.contentLabel")}
                </FormLabel>
                <FormControl>
                  <RichTextEditor
                    onChange={field.onChange}
                    placeholder={t("newPostPage.contentPlaceholder")}
                    userId={profile.id}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between gap-3 border-t pt-6">
            <Link
              href="/posts"
              className="label-caps underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("newPostPage.cancel")}
            </Link>
            <Button type="submit" size="lg" disabled={createPost.isPending}>
              {createPost.isPending
                ? t("newPostPage.publishing")
                : t("newPostPage.publish")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
