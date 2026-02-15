import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  shared: {
    VERCEL_URL: z
      .string()
      .optional()
      .transform((v) => (v ? `https://${v}` : undefined)),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
  },
  server: {
    SUPABASE_SERVICE_KEY: z.string(),
    RIOT_API_KEY: z.string(),
  },
  client: {
    NEXT_PUBLIC_LCU_DOWNLOAD_URL: z.string().url().optional(),
    NEXT_PUBLIC_LCU_DOWNLOAD_ZIP_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    NEXT_PUBLIC_SUPABASE_URL: z.string(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_LCU_DOWNLOAD_URL: process.env.NEXT_PUBLIC_LCU_DOWNLOAD_URL,
    NEXT_PUBLIC_LCU_DOWNLOAD_ZIP_URL: process.env.NEXT_PUBLIC_LCU_DOWNLOAD_ZIP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    PORT: process.env.PORT,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    VERCEL_URL: process.env.VERCEL_URL,
    RIOT_API_KEY: process.env.RIOT_API_KEY,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
