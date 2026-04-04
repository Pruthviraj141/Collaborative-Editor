"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { Navbar } from "@/components/landing/Navbar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const client = getSupabaseBrowserClient();
      const {
        data: { session }
      } = await client.auth.getSession();

      if (!mounted) {
        return;
      }

      if (session?.user) {
        router.replace("/dashboard");
        return;
      }

      setReady(true);
    };

    void checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) {
    return <main className="min-h-screen bg-[#080812]" aria-hidden="true" />;
  }

  return (
    <main className="bg-[#080812] text-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <LiveDemo />
      <Footer />
    </main>
  );
}