"use client";

import { parseAsBoolean, useQueryState } from "nuqs";

export function useDownloadDialog() {
  return useQueryState(
    "download",
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true }),
  );
}
