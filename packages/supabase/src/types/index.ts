import type * as supabase from "@supabase/supabase-js";
import type { Database } from "./db";

export type Client = supabase.SupabaseClient<Database>;
export type Session = supabase.Session;
export type User = supabase.User;

export * as Supabase from "@supabase/supabase-js";
export * from "./db";
