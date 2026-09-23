import { ALL_TIME_SEASON } from "@v1/domain/season";
import { z } from "zod";

export {
  ALL_TIME_SEASON,
  isAllTime,
  QUALIFICATION_MATCHES,
} from "@v1/domain/season";

/** Rating track a query is scoped to: a ladder season id, or the all-time track. */
export const seasonInput = z.number().int().min(ALL_TIME_SEASON);
