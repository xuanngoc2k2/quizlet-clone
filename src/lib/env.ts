import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1),
    GEMINI_API_KEYS: z.string().optional(),
    GEMINI_API_BACKUP: z.string().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_API_KEYS: process.env.GEMINI_API_KEYS,
    GEMINI_API_BACKUP: process.env.GEMINI_API_BACKUP,
    NODE_ENV: process.env.NODE_ENV,
  },
})
