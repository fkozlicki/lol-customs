"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";
import { Icons } from "../icons";

interface CreateAuctionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "outline";
}

/** Opens a new auction; the page header and the empty list both offer it. */
export function CreateAuctionButton({
  onClick,
  disabled,
  variant = "default",
}: CreateAuctionButtonProps) {
  const t = useTranslations("auctions.list");

  return (
    <Button variant={variant} onClick={onClick} disabled={disabled}>
      <Icons.Auction className="size-4" />
      {t("create")}
    </Button>
  );
}
