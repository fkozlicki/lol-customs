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

const BY_SQLSTATE: Record<string, TRPCErrorCode> = {
  "23505": "CONFLICT",
  "23503": "BAD_REQUEST",
  "23502": "BAD_REQUEST",
  "23514": "BAD_REQUEST",
  "22P02": "BAD_REQUEST",
  "22023": "BAD_REQUEST",
  // A plain `RAISE EXCEPTION`.
  P0001: "BAD_REQUEST",
  "42501": "FORBIDDEN",
  "57014": "TIMEOUT",
  // PGRST116 is deliberately absent: lookups use `.maybeSingle()`, so it only means a duplicate row
  // or a write that returned nothing, which is a server error.
};

// `RAISE ... USING ERRCODE = 'PTxxx'` chooses its own HTTP status.
const BY_HTTP_STATUS: Record<string, TRPCErrorCode> = {
  "400": "BAD_REQUEST",
  "401": "UNAUTHORIZED",
  "403": "FORBIDDEN",
  "404": "NOT_FOUND",
  "409": "CONFLICT",
  "429": "TOO_MANY_REQUESTS",
};

/**
 * What the client is told. Written for developers and logs: the app shows its own translated text,
 * picked by the error's code.
 */
const MESSAGES: Partial<Record<TRPCErrorCode, string>> = {
  BAD_REQUEST: "Invalid request.",
  UNAUTHORIZED: "Sign in first.",
  FORBIDDEN: "Not allowed.",
  NOT_FOUND: "Not found.",
  CONFLICT: "Already exists.",
  TIMEOUT: "The request took too long.",
  TOO_MANY_REQUESTS: "Too many requests.",
};

export const SERVER_ERROR_MESSAGE = "Something went wrong.";

/**
 * The tRPC error a database error becomes. The database's own text names tables, columns and
 * constraints, so it stays in `cause` for the server's logs and never reaches the client.
 */
export function toTRPCError(error: DatabaseError): TRPCError {
  const status = /^PT(\d{3})$/.exec(error.code)?.[1];
  const code =
    (status ? BY_HTTP_STATUS[status] : BY_SQLSTATE[error.code]) ??
    "INTERNAL_SERVER_ERROR";
  return new TRPCError({
    code,
    message: MESSAGES[code] ?? SERVER_ERROR_MESSAGE,
    cause: error,
  });
}
