import { initTRPC, TRPCError } from "@trpc/server";
import { createClient } from "@v1/supabase/server";
import superjson from "superjson";
import { ZodError, z } from "zod";
import {
  auctionRuleOf,
  isDatabaseError,
  SERVER_ERROR_MESSAGE,
  toTRPCError,
} from "./errors";
import { createLoggerPlugin } from "./logger";

/**
 * The context of one tRPC request (one HTTP batch, or one server render): a Supabase client carrying
 * the request's cookies, so row-level security runs as the visitor, and the visitor, checked once with
 * Supabase Auth. `getSession()` is not used: on the server it only decodes the cookie without
 * checking it.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: {
  headers?: Headers;
  source?: string;
  logLevel?: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
}) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    user,
    headers: opts.headers,
    source: opts.headers?.get("x-trpc-source") ?? opts.source ?? "unknown",
    logLevel: opts.logLevel ?? "info",
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    // Anything unexpected may carry internals in its message; the logs keep the original.
    message:
      error.code === "INTERNAL_SERVER_ERROR" &&
      process.env.NODE_ENV === "production"
        ? SERVER_ERROR_MESSAGE
        : shape.message,
    data: {
      ...shape.data,
      // Only an invalid input explains itself; a failed check of the database's JSON stays in the logs.
      zodError:
        error.code === "BAD_REQUEST" && error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
      // The auction rule an action broke, for the app to word in the viewer's language.
      auctionRule: auctionRuleOf(error.cause),
    },
  }),
});

export const createTRPCRouter = t.router;

/** A database error from any procedure becomes a tRPC error with a safe message (see `errors.ts`). */
const mapDatabaseErrors = t.middleware(async ({ next }) => {
  const result = await next();
  if (!result.ok && isDatabaseError(result.error.cause)) {
    throw toTRPCError(result.error.cause);
  }
  return result;
});

const baseProcedure = t.procedure
  .concat(createLoggerPlugin().logger)
  .use(mapDatabaseErrors);

/** Open to visitors; `ctx.user` is the signed-in user, or null. */
export const publicProcedure = baseProcedure;

/** Signed-in users only; `ctx.user` is never null. */
export const protectedProcedure = baseProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { user: ctx.user } });
});
