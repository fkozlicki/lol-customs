"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@v1/supabase/client";
import { ProfileSetupDialog } from "@v1/ui/recipes/auth/profile-setup-dialog";
import { toast } from "@v1/ui/sonner";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTRPC } from "@/trpc/react";
import { useUser } from "./user-context";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/**
 * Signing in is setting up a profile: an anonymous session, an optional avatar uploaded to
 * storage, and a nickname.
 */
export function SignInDialog() {
  const { signInDialogOpen, closeSignInDialog, refreshProfile } = useUser();
  const t = useTranslations("dashboard.auth.profile");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        nickname: z
          .string()
          .min(2, t("nickname.tooShort"))
          .max(30, t("nickname.tooLong"))
          .regex(/^[a-zA-Z0-9_\- ]+$/, t("nickname.invalid")),
      }),
    [t],
  );
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { nickname: "" },
  });

  function reset() {
    form.reset();
    setAvatarFile(null);
    setAvatarPreview(null);
  }

  const setupProfile = useMutation(
    trpc.userProfiles.setup.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.userProfiles.me.queryOptions());
        refreshProfile();
        closeSignInDialog();
        reset();
        toast.success(t("toast.success"));
      },
      onError: (err) => {
        toast.error(err.message);
        setIsSubmitting(false);
      },
    }),
  );

  function pickAvatar(file: File) {
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t("toast.avatarTooLarge"));
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit({ nickname }: z.infer<typeof schema>) {
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

    setupProfile.mutate({ nickname, avatar_url: avatarUrl });
  }

  return (
    <ProfileSetupDialog
      open={signInDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeSignInDialog();
          reset();
          setIsSubmitting(false);
        }
      }}
      avatarPreview={avatarPreview}
      onPickAvatar={pickAvatar}
      nickname={form.watch("nickname")}
      nicknameInput={form.register("nickname")}
      nicknameError={form.formState.errors.nickname?.message}
      pending={isSubmitting || setupProfile.isPending}
      onSubmit={form.handleSubmit(onSubmit)}
    />
  );
}
