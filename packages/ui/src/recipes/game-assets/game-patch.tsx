"use client";

import { GENERATED_PATCH } from "@v1/game-assets/champions";
import { createContext, useContext } from "react";

/**
 * The patch game images are drawn from. The dashboard layout provides the live one; anywhere
 * without a provider — a story, a test — gets the patch the champion list was generated from, which is
 * always a real patch. So there is no loading state and nothing to mock.
 */
const GamePatchContext = createContext(GENERATED_PATCH);

export function GamePatchProvider({
  patch,
  children,
}: {
  patch: string;
  children: React.ReactNode;
}) {
  return <GamePatchContext value={patch}>{children}</GamePatchContext>;
}

export function useGamePatch() {
  return useContext(GamePatchContext);
}
