"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header className={`landing-navbar ${scrolled ? "is-scrolled" : ""}`}>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="inline-flex items-center gap-3 text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="12" height="12" rx="3" stroke="white" strokeWidth="1.5" />
            <rect x="9" y="9" width="12" height="12" rx="3" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5" />
          </svg>
          <span className="text-base font-semibold tracking-tight">Live Editor</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/auth" className="hidden text-sm text-white transition-all duration-200 ease-in hover:underline md:inline-block">
            Sign in
          </Link>
          <Link
            href="/auth?tab=signup"
            className="rounded-lg border border-white/10 bg-white px-5 py-2 text-sm font-semibold text-[#0b0b16] transition-all duration-200 ease-in hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
