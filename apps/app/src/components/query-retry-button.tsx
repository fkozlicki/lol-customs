"use client";

import { Button } from "@v1/ui/button";
import { useTranslations } from "next-intl";
import { useQueryRetry } from "./query-retry";

/** Tries the failed queries of the `QueryBoundary` around it again; goes into an error recipe's slot. */
export function QueryRetryButton() {
  const t = useTranslations("dashboard");
  const retry = useQueryRetry();

  return (
    <Button variant="outline" onClick={retry}>
      {t("retry")}
    </Button>
  );
}
