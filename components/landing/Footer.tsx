import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#05050f] px-4 pb-6 pt-10 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="inline-flex items-center gap-3 text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="12" height="12" rx="3" stroke="white" strokeWidth="1.5" />
              <rect x="9" y="9" width="12" height="12" rx="3" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5" />
            </svg>
            <span className="font-semibold">Live Editor</span>
          </div>

          <p className="text-[13px] text-white/45">Made with Tiptap · Yjs · Supabase · Next.js</p>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/45 md:flex-row md:items-center">
          <p>© 2025 Live Editor. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <Link href="/auth" className="transition-all duration-200 ease-in hover:text-white">
              Sign in
            </Link>
            <Link href="/auth?tab=signup" className="transition-all duration-200 ease-in hover:text-white">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
