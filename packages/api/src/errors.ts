import { TRPCError } from "@trpc/server";

type TRPCErrorCode = ConstructorParameters<typeof TRPCError>[0]["code"];

/**
 * A failed PostgREST call: a SQLSTATE or `PGRST` code, and text written for developers. supabase-js
 * returns it as `{ error }`, or throws it as a `PostgrestError` after `.throwOnError()`.
 */
export interface DatabaseError {
  code: string;
  message: string;
  details: string | null;
  hint: string | null;
}

export function isDatabaseError(value: unknown): value is DatabaseError {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { code?: unknown }).code === "string" &&
    "message" in value &&
    "details" in value &&
    "hint" in value
  );
}

const BY_CODE: Record<string, [TRPCErrorCode, string]> = {
  // `.single()` found no row, or more than one.
  PGRST116: ["NOT_FOUND", "Not found."],
  "23505": ["CONFLICT", "That already exists."],
  "23503": ["BAD_REQUEST", "Invalid request."],
  "23502": ["BAD_REQUEST", "Invalid request."],
  "23514": ["BAD_REQUEST", "Invalid request."],
  "22P02": ["BAD_REQUEST", "Invalid request."],
  "22023": ["BAD_REQUEST", "Invalid request."],
  // A plain `RAISE EXCEPTION`.
  P0001: ["BAD_REQUEST", "Invalid request."],
  "42501": ["FORBIDDEN", "You are not allowed to do that."],
  "57014": ["TIMEOUT", "The request took too long."],
};

// `RAISE ... USING ERRCODE = 'PTxxx'` chooses its own HTTP status.
const BY_STATUS: Record<string, [TRPCErrorCode, string]> = {
  "400": ["BAD_REQUEST", "Invalid request."],
  "401": ["UNAUTHORIZED", "Sign in first."],
  "403": ["FORBIDDEN", "You are not allowed to do that."],
  "404": ["NOT_FOUND", "Not found."],
  "409": ["CONFLICT", "That already exists."],
  "429": ["TOO_MANY_REQUESTS", "Too many requests."],
};

/**
 * The tRPC error a database error becomes. The database's own text names tables, columns and
 * constraints, so it stays in `cause` for the server's logs and never reaches the client.
 */
export function toTRPCError(error: DatabaseError): TRPCError {
  const status = /^PT(\d{3})$/.exec(error.code)?.[1];
  const [code, message] = (status
    ? BY_STATUS[status]
    : BY_CODE[error.code]) ?? [
    "INTERNAL_SERVER_ERROR",
    "Something went wrong.",
  ];
  return new TRPCError({ code, message, cause: error });
}
