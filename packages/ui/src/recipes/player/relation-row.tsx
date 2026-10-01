"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ProfileIcon } from "../game-assets/profile-icon";
import type { RelationView } from "./player-view";

interface RelationRowProps {
  label: string;
  relation: RelationView | null;
  /** The figure on the right: matches together, a record, kills. */
  detail: (relation: RelationView) => React.ReactNode;
  /** What an empty row says; "not enough matches yet" unless given. */
  emptyLabel?: string;
}

export function RelationRow({
  label,
  relation,
  detail,
  emptyLabel,
}: RelationRowProps) {
  const t = useTranslations("player");

  if (!relation) {
    return (
      <li className="flex h-14 flex-col justify-center">
        <span className="label-caps">{label}</span>
        <span className="truncate text-xs text-muted-foreground">
          {emptyLabel ?? t("noRelation")}
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link href={relation.href} className="group flex h-14 items-center gap-3">
        <ProfileIcon
          iconId={relation.iconId}
          name={relation.name}
          fallbackChars={1}
          avatarClassName="size-8 rounded-none"
          fallbackClassName="rounded-none text-xs"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="label-caps">{label}</span>
          <span className="truncate text-sm font-medium underline-offset-4 group-hover:underline">
            {relation.name}
          </span>
        </div>
        <span className="num shrink-0 text-sm text-muted-foreground">
          {detail(relation)}
        </span>
      </Link>
    </li>
  );
}
