import "server-only";
import type { Client } from "../types";

/** The signed-in user's profile; null until they set one up. */
export async function getUserProfile(client: Client, userId: string) {
  const { data, error } = await client
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Whether the user has set up a profile, which posting and auctions require. */
export async function hasUserProfile(client: Client, userId: string) {
  const { data, error } = await client
    .from("user_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

/** Creates or changes the user's profile. A taken nickname is a unique violation (23505). */
export async function saveUserProfile(
  client: Client,
  profile: { id: string; nickname: string; avatar_url: string | null },
) {
  const { data, error } = await client
    .from("user_profiles")
    .upsert(profile)
    .select()
    .single();
  if (error) throw error;
  return data;
}
