"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@v1/ui/dialog";
import { Icons } from "@v1/ui/icons";
import { useState } from "react";

/** A help button in the corner, and what it explains: pick the folder, fetch, tick, save. */
export function HelpDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 flex size-10 items-center justify-center rounded-lg bg-black text-white shadow-md transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Help"
      >
        <Icons.HelpCircle className="size-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>How it works</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-left text-sm text-muted-foreground">
                <p>
                  This app syncs your <strong>custom game</strong> match history
                  from the League client to Niunio. It uses the same client
                  (Riot Games) that runs when you play League.
                </p>
                <p>
                  <strong>What you do:</strong> Select your League of Legends
                  install folder once. When the League client is running and
                  you’re logged in, tap “Fetch games”. Choose which games to
                  save, then tap “Save selected”. Already saved games are marked
                  and cannot be saved again.
                </p>
                <p>
                  The status badge shows whether the client is running. Fetch
                  and save only work when the client is open and you’re logged
                  in.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
