import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_DB_URL: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL_NAME: z.string().min(1).default("llama-3.3-70b-versatile"),
  COLLAB_TOKEN_SECRET: z.string().min(24).optional(),
  COLLAB_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

const parsed = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL_NAME: process.env.GROQ_MODEL_NAME,
  COLLAB_TOKEN_SECRET: process.env.COLLAB_TOKEN_SECRET,
  COLLAB_TOKEN_TTL_SECONDS: process.env.COLLAB_TOKEN_TTL_SECONDS,
  NODE_ENV: process.env.NODE_ENV
});

if (!parsed.success) {
  throw new Error(`Invalid server environment variables: ${parsed.error.message}`);
}

export const serverEnv = parsed.data;

export function getCollabTokenSecret() {
  if (serverEnv.COLLAB_TOKEN_SECRET) {
    return serverEnv.COLLAB_TOKEN_SECRET;
  }

  if (serverEnv.NODE_ENV === "development") {
    return "dev-collab-token-secret-change-before-production";
  }

  throw new Error("COLLAB_TOKEN_SECRET is required in non-development environments");
}
