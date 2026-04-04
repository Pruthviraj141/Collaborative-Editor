import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim().length === 0) {
      return undefined;
    }

    return value;
  },
  z.string().url().optional()
);

const optionalBoolean = z.preprocess(
  (value) => {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") {
        return true;
      }

      if (normalized === "false" || normalized.length === 0) {
        return false;
      }
    }

    return false;
  },
  z.boolean().default(false)
);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_WS_URL: optionalUrl,
  NEXT_PUBLIC_EDITOR_DEFAULT_TITLE: z.string().min(1),
  NEXT_PUBLIC_DEFAULT_WORKSPACE_ID: z.string().uuid().or(z.string().min(1)),
  NEXT_PUBLIC_HOCUSPOCUS_URL: optionalUrl,
  NEXT_PUBLIC_SOCKET_URL: optionalUrl,
  NEXT_PUBLIC_ALLOW_GUEST_WRITE: optionalBoolean
});

const publicParsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_EDITOR_DEFAULT_TITLE: process.env.NEXT_PUBLIC_EDITOR_DEFAULT_TITLE,
  NEXT_PUBLIC_DEFAULT_WORKSPACE_ID: process.env.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID,
  NEXT_PUBLIC_HOCUSPOCUS_URL: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  NEXT_PUBLIC_ALLOW_GUEST_WRITE: process.env.NEXT_PUBLIC_ALLOW_GUEST_WRITE
});

if (!publicParsed.success) {
  throw new Error(`Invalid public environment variables: ${publicParsed.error.message}`);
}

export const publicEnv = publicParsed.data;