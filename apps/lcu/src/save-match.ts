import type { LcuMatchDetails } from "./lcu-types.js";
import { supabase } from "./supabase.js";
import { transformMatch } from "./transform-match.js";

/** Returns true if match was saved, false if skipped. */
export async function saveMatch(match: LcuMatchDetails): Promise<boolean> {
  const transformed = transformMatch(match);

  if (!transformed) {
    console.log("Skipped invalid match:", match.gameId);
    return false;
  }

  const { matchRow, teams, players, participants } = transformed;

  const { error: matchError } = await supabase.from("matches").upsert(matchRow);

  if (matchError) {
    console.error("Match insert error:", matchError);
    return false;
  }

  const { error: playersError } = await supabase
    .from("players")
    .upsert(players);

  if (playersError) {
    console.error("Players insert error:", playersError);
    return false;
  }

  const { error: teamsError } = await supabase.from("teams").upsert(teams);

  if (teamsError) {
    console.error("Teams insert error:", teamsError);
    return false;
  }

  const { error: participantsError } = await supabase
    .from("match_participants")
    .upsert(participants);

  if (participantsError) {
    console.error("Participants insert error:", participantsError);
    return false;
  }

  console.log("Saved match:", match.gameId);
  return true;
}
