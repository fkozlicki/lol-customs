"use client";

import { useTranslations } from "next-intl";
import type { ComponentProps, FormEventHandler } from "react";
import { Button } from "../../components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/dialog";
import { Input } from "../../components/input";
import { cn } from "../../utils/cn";
import { AvatarPicker } from "./avatar-picker";

interface ProfileSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avatarPreview: string | null;
  onPickAvatar: (file: File) => void;
  /** The nickname typed so far, whose first letter stands in for a missing avatar. */
  nickname: string;
  /** The nickname field's props, e.g. what react-hook-form's `register` returns. */
  nicknameInput: ComponentProps<"input">;
  /** Why the nickname will not do, once the form has been sent. */
  nicknameError?: string;
  pending: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

/** Joining Derby: an optional avatar and a nickname, which is all a profile needs. */
export function ProfileSetupDialog({
  open,
  onOpenChange,
  avatarPreview,
  onPickAvatar,
  nickname,
  nicknameInput,
  nicknameError,
  pending,
  onSubmit,
}: ProfileSetupDialogProps) {
  const t = useTranslations("profileSetup");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-2xl font-semibold uppercase tracking-[-0.02em]">
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <AvatarPicker
            preview={avatarPreview}
            initial={nickname[0]?.toUpperCase() ?? null}
            onPick={onPickAvatar}
          />

          <div className="space-y-2">
            <label
              htmlFor="profile-nickname"
              className={cn("label-caps", nicknameError && "text-destructive")}
            >
              {t("nicknameLabel")}
            </label>
            <Input
              id="profile-nickname"
              placeholder={t("nicknamePlaceholder")}
              aria-invalid={Boolean(nicknameError)}
              aria-describedby={
                nicknameError ? "profile-nickname-error" : undefined
              }
              {...nicknameInput}
            />
            {nicknameError && (
              <p
                id="profile-nickname-error"
                className="text-[0.8rem] font-medium text-destructive"
              >
                {nicknameError}
              </p>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? t("settingUp") : t("submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
