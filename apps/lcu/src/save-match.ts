import type { LcuMatchDetails } from "./lcu-types.js";
import { supabase } from "./supabase.js";
import {
  transformMatch,
  type TransformOptions,
} from "./transform-match.js";

/** Returns true if match was saved, false if skipped. */
export async function saveMatch(
  match: LcuMatchDetails,
  options?: TransformOptions,
): Promise<boolean> {
  const transformed = transformMatch(match, options);

  if (!transformed) {
    console.log("Skipped invalid match:", match.gameId);
    return false;
  }

  const { matchRow, teams, players, participants } = transformed;

  const { error: matchError } = await supabase.from("matches").upsert(matchRow);

  if (matchError) {
    console.error("Match insert error:", matchError.message, matchError.code, matchError.details);
    return false;
  }

  const { error: playersError } = await supabase
    .from("players")
    .upsert(players);

  if (playersError) {
    console.error("Players insert error:", playersError.message, playersError.code, playersError.details);
    return false;
  }

  const { error: teamsError } = await supabase.from("teams").upsert(teams);

  if (teamsError) {
    console.error("Teams insert error:", teamsError.message, teamsError.code, teamsError.details);
    return false;
  }

  const { error: participantsError } = await supabase
    .from("match_participants")
    .upsert(participants, { onConflict: "match_id,puuid" });

  if (participantsError) {
    console.error(
      "Participants insert error:",
      participantsError.message,
      participantsError.code,
      participantsError.details,
    );
    return false;
  }

  console.log("Saved match:", match.gameId);
  return true;
}
