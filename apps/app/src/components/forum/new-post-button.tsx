"use client";

import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/recipes/icons";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUser } from "@/components/auth/user-context";

/** Starts a new post; a signed-out reader is asked to sign in first, and it waits while the session is read. */
export function NewPostButton({
  size = "default",
}: {
  size?: "sm" | "default";
}) {
  const t = useTranslations("dashboard.pages.posts");
  const router = useRouter();
  const { profile, isLoading, openSignInDialog } = useUser();

  return (
    <Button
      variant="outline"
      size={size}
      disabled={isLoading}
      onClick={() => (profile ? router.push("/posts/new") : openSignInDialog())}
    >
      <Icons.PenSquare className="size-4" />
      {t("newPost")}
    </Button>
  );
}
