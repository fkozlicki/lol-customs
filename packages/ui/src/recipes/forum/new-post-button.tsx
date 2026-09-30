"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";
import { Icons } from "../icons";

interface NewPostButtonProps {
  onClick: () => void;
  size?: "sm" | "default";
}

/** Starts a new post; the app decides whether that means signing in first. */
export function NewPostButton({
  onClick,
  size = "default",
}: NewPostButtonProps) {
  const t = useTranslations("forum");

  return (
    <Button variant="outline" size={size} onClick={onClick}>
      <Icons.PenSquare className="size-4" />
      {t("newPost")}
    </Button>
  );
}
