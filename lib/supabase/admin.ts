import { createClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type { Database } from "@/types/supabase";

let adminClient: ReturnType<typeof createClient<Database>> | undefined;

export function getSupabaseAdminClient() {
  if (!adminClient) {
    adminClient = createClient<Database>(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return adminClient;
}