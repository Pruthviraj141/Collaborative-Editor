import { resolve } from "node:path";

import { config } from "dotenv";

import { z } from "zod";

config();
config({ path: resolve(process.cwd(), "..", ".env"), override: false });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOCUSPOCUS_HOST: z.string().default("0.0.0.0"),
  HOCUSPOCUS_PORT: z.coerce.number().int().positive().default(1234),
  COLLAB_TOKEN_SECRET: z.string().min(24).optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  COLLAB_DISABLE_PERSISTENCE: z.coerce.boolean().default(false),
  COLLAB_UPDATE_FLUSH_MS: z.coerce.number().int().positive().default(1800),
  COLLAB_VERSION_INTERVAL: z.coerce.number().int().positive().default(40)
});

const parsed = envSchema.safeParse({
  ...process.env,
  SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
});

if (!parsed.success) {
  throw new Error(`Invalid collaboration server env: ${parsed.error.message}`);
}

export const collabEnv = parsed.data;

export function getCollabTokenSecret() {
  if (collabEnv.COLLAB_TOKEN_SECRET) {
    return collabEnv.COLLAB_TOKEN_SECRET;
  }

  if (collabEnv.NODE_ENV === "development") {
    return "dev-collab-token-secret-change-before-production";
  }

  throw new Error("COLLAB_TOKEN_SECRET is required in non-development environments");
}
