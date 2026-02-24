"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@v1/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import { Button } from "@v1/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@v1/ui/dialog";
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
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { useUser } from "./user-context";

const schema = z.object({
  nickname: z
    .string()
    .min(2, "Nickname must be at least 2 characters")
    .max(30, "Nickname must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_\- ]+$/,
      "Only letters, numbers, spaces, underscores and dashes",
    ),
});

type FormValues = z.infer<typeof schema>;

export function SignInDialog() {
  const { signInDialogOpen, closeSignInDialog, refreshProfile } = useUser();
  const t = useScopedI18n("dashboard.auth.profile");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nickname: "" },
  });

  const setupProfile = useMutation(
    trpc.userProfiles.setup.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.userProfiles.me.queryOptions());
        refreshProfile();
        closeSignInDialog();
        form.reset();
        setAvatarFile(null);
        setAvatarPreview(null);
        toast.success(t("toast.success"));
      },
      onError: (err) => {
        toast.error(err.message);
        setIsSubmitting(false);
      },
    }),
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("toast.avatarTooLarge"));
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const supabase = createClient();

    // ensure anonymous session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      const { error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) {
        toast.error(t("toast.signInFailed"), {
          description: signInError.message,
        });
        setIsSubmitting(false);
        return;
      }
    }

    // get the user id (may have just been created above)
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      toast.error(t("toast.getUserFailed"));
      setIsSubmitting(false);
      return;
    }

    let avatarUrl: string | null = null;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });

      if (uploadError) {
        toast.error(t("toast.avatarUploadFailed"));
      } else {
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }
    }

    setupProfile.mutate({ nickname: values.nickname, avatar_url: avatarUrl });
  }

  const nickname = form.watch("nickname");

  return (
    <Dialog
      open={signInDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeSignInDialog();
          form.reset();
          setAvatarFile(null);
          setAvatarPreview(null);
          setIsSubmitting(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Avatar picker */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative size-20 rounded-full overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
                aria-label="Upload avatar"
              >
                <Avatar className="size-full">
                  <AvatarImage src={avatarPreview ?? undefined} />
                  <AvatarFallback className="text-2xl font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                    {nickname ? (
                      nickname[0]?.toUpperCase()
                    ) : (
                      <Icons.Camera className="size-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Icons.Camera className="size-5 text-white" />
                </div>
              </button>
              <p className="text-xs text-muted-foreground">{t("uploadHint")}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nicknameLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("nicknamePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || setupProfile.isPending}
            >
              {isSubmitting || setupProfile.isPending
                ? t("settingUp")
                : t("submit")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
