import { TRPCError } from "@trpc/server";
import { type AuctionRule, isAuctionRule } from "@v1/domain/auction";

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

/** How each auction rule a function refused an action by reaches the client. */
const BY_AUCTION_RULE: Record<AuctionRule, TRPCErrorCode> = {
  AUCTION_ROOM_NOT_FOUND: "NOT_FOUND",
  AUCTION_PROFILE_REQUIRED: "FORBIDDEN",
  AUCTION_PERMISSION_DENIED: "FORBIDDEN",
  AUCTION_PASS_NOT_ALLOWED: "FORBIDDEN",
  AUCTION_CONCEDE_NOT_ALLOWED: "FORBIDDEN",
  AUCTION_TAKE_NOT_ALLOWED: "FORBIDDEN",
  AUCTION_ALREADY_CAPTAIN: "CONFLICT",
  AUCTION_CAPTAIN_SLOT_TAKEN: "CONFLICT",
  AUCTION_DEADLINE_PASSED: "CONFLICT",
  AUCTION_REQUEST_ID_REQUIRED: "BAD_REQUEST",
  AUCTION_IDEMPOTENCY_KEY_REUSED: "BAD_REQUEST",
  AUCTION_ROOM_NOT_WAITING: "BAD_REQUEST",
  AUCTION_ROOM_STARTED: "BAD_REQUEST",
  AUCTION_ROOM_TERMINAL: "BAD_REQUEST",
  AUCTION_CAPTAIN_SLOT_EMPTY: "BAD_REQUEST",
  AUCTION_NEEDS_TWO_CAPTAINS: "BAD_REQUEST",
  AUCTION_PLAYERS_INVALID: "BAD_REQUEST",
  AUCTION_PLAYERS_NOT_UNIQUE: "BAD_REQUEST",
  AUCTION_BUDGET_INVALID: "BAD_REQUEST",
  AUCTION_BID_SECONDS_INVALID: "BAD_REQUEST",
  AUCTION_TEAM_NAME_INVALID: "BAD_REQUEST",
  AUCTION_BIDDING_CLOSED: "BAD_REQUEST",
  AUCTION_BID_TOO_LOW: "BAD_REQUEST",
  AUCTION_BUDGET_EXCEEDED: "BAD_REQUEST",
  AUCTION_LEADER_CANNOT_BID: "BAD_REQUEST",
  AUCTION_LEADER_CANNOT_CONCEDE: "BAD_REQUEST",
};

/** The auction rule a database error refused an action by, or null for any other error. */
export function auctionRuleOf(error: unknown): AuctionRule | null {
  return isDatabaseError(error) &&
    error.code === "P0001" &&
    isAuctionRule(error.message)
    ? error.message
    : null;
}

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
  const rule = auctionRuleOf(error);
  if (rule) {
    // The rule reaches the app as `data.auctionRule` (`trpc.ts`), which words it from its dictionary.
    const code = BY_AUCTION_RULE[rule];
    return new TRPCError({ code, message: MESSAGES[code], cause: error });
  }
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
