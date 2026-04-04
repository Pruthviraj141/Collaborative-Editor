"use client";

import { useEffect } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/store/session-store";

export function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const setSession = useSessionStore((state) => state.setSession);

  useEffect(() => {
    const client = getSupabaseBrowserClient();

    const init = async () => {
      const {
        data: { session }
      } = await client.auth.getSession();

      if (!session?.user) {
        setSession(null);
        return;
      }

      setSession({
        userId: session.user.id,
        email: session.user.email ?? null
      });
    };

    void init();

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((_, session) => {
      if (!session?.user) {
        setSession(null);
        return;
      }

      setSession({
        userId: session.user.id,
        email: session.user.email ?? null
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession]);

  return children;
}