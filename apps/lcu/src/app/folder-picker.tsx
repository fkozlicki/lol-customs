"use client";

import { Alert, AlertDescription } from "@v1/ui/alert";
import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";
import { truncatePath } from "./games";

interface FolderPickerProps {
  /** The League folder in use, chosen or detected; null before there is one. */
  path: string | null;
  error: string | null;
  onChoose: () => void;
}

/** Where League is installed, and a way to point the app at it. */
export function FolderPicker({ path, error, onChoose }: FolderPickerProps) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="default" onClick={onChoose}>
          <Icons.Folder className="size-4 shrink-0" />
          {path ? "Change folder" : "Select League folder"}
        </Button>
        {path && (
          <span className="font-mono text-xs text-muted-foreground">
            {truncatePath(path)}
          </span>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
