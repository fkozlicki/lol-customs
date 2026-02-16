import { NextResponse } from "next/server";
import { env } from "@/env.mjs";

/**
 * Public endpoint for the LCU Electron app to check minimum allowed version.
 * Returns minimumVersion and downloadUrl so the app can gate old versions and point users to the latest installer.
 */
export function GET() {
  const minimumVersion = env.LCU_MINIMUM_VERSION;
  const downloadUrl =
    env.NEXT_PUBLIC_LCU_DOWNLOAD_URL ??
    env.NEXT_PUBLIC_LCU_DOWNLOAD_ZIP_URL ??
    "";

  return NextResponse.json({
    minimumVersion,
    downloadUrl,
  });
}
