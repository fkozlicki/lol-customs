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
    <div className="max-w-3xl mx-auto space-y-4 py-6">
      <Button variant="outline" asChild>
        <Link href="/posts">
          <Icons.ChevronLeft className="size-4" /> {t("backToPosts")}
        </Link>
      </Button>

      <div>
        <h1 className="text-xl font-semibold">{t("newPostPage.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("newPostPage.description")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("newPostPage.titleLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("newPostPage.titlePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("newPostPage.contentLabel")}</FormLabel>
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

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" asChild>
              <Link href="/posts">{t("newPostPage.cancel")}</Link>
            </Button>
            <Button type="submit" disabled={createPost.isPending}>
              {createPost.isPending ? t("newPostPage.publishing") : t("newPostPage.publish")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
