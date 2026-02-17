"use client";

import { Icons } from "@v1/ui/icons";
import { useEffect, useState } from "react";

type VersionState =
  | { status: "checking" }
  | { status: "allowed" }
  | { status: "blocked"; downloadUrl: string };

export function VersionCheckGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<VersionState>({ status: "checking" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.lcu?.onVersionCheckResult) {
      setState({ status: "allowed" });
      return;
    }
    window.lcu.onVersionCheckResult((result) => {
      if (result.allowed) {
        setState({ status: "allowed" });
      } else {
        setState({ status: "blocked", downloadUrl: result.downloadUrl });
      }
    });
  }, []);

  if (state.status === "checking") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <Icons.Loader className="size-10 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Checking for updates...</p>
      </div>
    );
  }

  if (state.status === "blocked") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <p className="text-lg font-medium">Update required</p>
        <p className="text-sm text-muted-foreground">
          A new version of Niunio is required. Please download the latest
          version.
        </p>
        {state.downloadUrl ? (
          <a
            href={state.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline underline-offset-4 hover:no-underline"
          >
            Download latest version
          </a>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}
