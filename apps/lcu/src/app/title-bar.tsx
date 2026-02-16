"use client";

import { Icons } from "@v1/ui/icons";
import { useEffect, useState } from "react";

export function TitleBar() {
  const [maximized, setMaximized] = useState(false);
  const [hasWindowControls, setHasWindowControls] = useState(false);

  useEffect(() => {
    setHasWindowControls(
      Boolean(
        window.lcu?.windowMinimize &&
          window.lcu?.windowMaximizeToggle &&
          window.lcu?.windowClose,
      ),
    );
    window.lcu?.onWindowMaximizedChanged?.(setMaximized);
  }, []);

  return (
    <header
      className="flex h-8 shrink-0 select-none items-center justify-end border-b border-border bg-card px-3"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {hasWindowControls && (
        <div
          className="flex items-center"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <button
            type="button"
            onClick={() => window.lcu?.windowMinimize?.()}
            className="flex size-8 items-center justify-center rounded-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Minimize"
          >
            <Icons.Minus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => window.lcu?.windowMaximizeToggle?.()}
            className="flex size-8 items-center justify-center rounded-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={maximized ? "Restore" : "Maximize"}
          >
            <Icons.Square className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => window.lcu?.windowClose?.()}
            className="flex size-8 items-center justify-center rounded-none text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
            aria-label="Close"
          >
            <Icons.X className="size-4" />
          </button>
        </div>
      )}
    </header>
  );
}
