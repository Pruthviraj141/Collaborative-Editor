import type { PropsWithChildren } from "react";

import { TopNav } from "@/components/layout/top-nav";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}