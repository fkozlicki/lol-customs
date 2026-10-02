"use client";

import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUser } from "@/components/auth/user-context";

/** Opens a new auction; a visitor is asked to sign in first, and it waits while the session is read. */
export function CreateAuctionButton({
  variant = "default",
}: {
  variant?: "default" | "outline";
}) {
  const t = useTranslations("dashboard.pages.auctions");
  const router = useRouter();
  const { profile, isLoading, openSignInDialog } = useUser();

  return (
    <Button
      variant={variant}
      disabled={isLoading}
      onClick={() =>
        profile ? router.push("/auctions/new") : openSignInDialog()
      }
    >
      <Icons.Auction className="size-4" />
      {t("create")}
    </Button>
  );
}
