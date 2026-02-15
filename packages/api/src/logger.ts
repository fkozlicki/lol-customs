import { initTRPC } from "@trpc/server";
import { createLogger } from "@v1/logger";
import type { User } from "@v1/supabase/types";

const headersToLowercase = (headers: Headers) => {
  const headersRecord: Record<string, string> = {};

  for (const [key, value] of headers.entries()) {
    headersRecord[key.toLowerCase()] = value;
  }

  return headersRecord;
};

export const createLoggerPlugin = () => {
  const t = initTRPC
    .context<{
      headers?: Headers;
      source: string;
      user?: User | null;
      logLevel: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
    }>()
    .create();

  const tRPCLogger = createLogger({
    redact: [
      "headers.authorization",
      'headers["proxy-authorization"]',
      'headers["x-auth-token"]',
      "headers.cookie",
      'headers["set-cookie"]',
      'headers["x-api-key"]',
      'headers["x-authorization"]',
    ],
    name: "tRPC",
  });

  return {
    logger: t.procedure.use(async (opts) => {
      const requestId = crypto.randomUUID();

      const logger = tRPCLogger.child({
        path: opts.path,
        type: opts.type,
        meta: opts.meta,
        user: opts.ctx.user?.id ?? "anon",
        requestId,
      });

      logger.level = opts.ctx.logLevel;

      try {
        const lowercaseHeaders = opts.ctx.headers
          ? headersToLowercase(opts.ctx.headers)
          : {};

        const loggerWithHeaders = logger.child({ headers: lowercaseHeaders });

        logger.info(">>> tRPC incoming request");

        logger.debug({ input: opts.input }, ">>> tRPC incoming request input");

        loggerWithHeaders.trace(">>> tRPC incoming request headers");

        const response = await opts.next({
          ctx: {
            logger,
          },
        });

        if (response.ok) {
          logger.info("<<< tRPC response");
          logger.debug({ data: response.data }, "<<< tRPC response data");
        } else {
          logger.error(response.error, "<<< tRPC response");
        }

        return response;
      } catch (e) {
        logger.error(e);
        throw e;
      }
    }),
  };
};
