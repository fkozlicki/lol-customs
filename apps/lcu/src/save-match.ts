import type { LcuMatchDetails } from "./lcu-types.js";
import { supabase } from "./supabase.js";
import {
  transformMatch,
  type TransformOptions,
} from "./transform-match.js";

export type SaveMatchResult =
  | { saved: true }
  | { saved: false; error: string };

/** Returns result with saved flag and error reason when failed. */
export async function saveMatch(
  match: LcuMatchDetails,
  options?: TransformOptions,
): Promise<SaveMatchResult> {
  const transformed = transformMatch(match, options);

  if (!transformed) {
    const msg = "Skipped invalid match (not custom, wrong player count, or too short).";
    console.log(msg, match.gameId);
    return { saved: false, error: msg };
  }

  const { matchRow, teams, players, participants } = transformed;

  const { error: matchError } = await supabase.from("matches").upsert(matchRow);

  if (matchError) {
    const msg = formatSupabaseError("Match", matchError);
    console.error("Match insert error:", msg);
    return { saved: false, error: msg };
  }

  const { error: playersError } = await supabase
    .from("players")
    .upsert(players);

  if (playersError) {
    const msg = formatSupabaseError("Players", playersError);
    console.error("Players insert error:", msg);
    return { saved: false, error: msg };
  }

  const { error: teamsError } = await supabase.from("teams").upsert(teams);

  if (teamsError) {
    const msg = formatSupabaseError("Teams", teamsError);
    console.error("Teams insert error:", msg);
    return { saved: false, error: msg };
  }

  const { error: participantsError } = await supabase
    .from("match_participants")
    .upsert(participants, { onConflict: "match_id,puuid" });

  if (participantsError) {
    const msg = formatSupabaseError("Participants", participantsError);
    console.error("Participants insert error:", msg);
    return { saved: false, error: msg };
  }

  console.log("Saved match:", match.gameId);
  return { saved: true };
}

function formatSupabaseError(
  label: string,
  err: { message?: string; code?: string; details?: string },
): string {
  const parts = [err.message ?? "Unknown error"];
  if (err.code) parts.push(`(${err.code})`);
  if (err.details) parts.push(String(err.details));
  return `${label}: ${parts.join(" ")}`;
}
