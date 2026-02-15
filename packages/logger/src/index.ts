import pino, { type LoggerOptions } from "pino";
import pretty from "pino-pretty";

export function createLogger<
  CustomLevels extends string = never,
  UseOnlyCustomLevels extends boolean = boolean,
>(options?: LoggerOptions<CustomLevels, UseOnlyCustomLevels>) {
  const stream =
    process.env.NODE_ENV === "development"
      ? pretty({
          colorize: true,
        })
      : undefined;

  return pino(options ?? {}, stream);
}

export type Logger = ReturnType<typeof createLogger>;
