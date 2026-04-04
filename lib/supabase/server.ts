import { cookies } from "next/headers";

import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

export function getSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({
            name,
            value: "",
            ...options
          });
        }
      }
    }
  );
}