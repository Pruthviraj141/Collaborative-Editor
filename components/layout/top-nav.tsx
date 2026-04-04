"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, LogOut, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { publicEnv } from "@/lib/env";
import { useSessionStore } from "@/store/session-store";

export function TopNav() {
  const router = useRouter();
  const { isAuthenticated, email } = useSessionStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const avatarLabel = email?.slice(0, 1).toUpperCase() ?? "U";

  const createDocument = async () => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: "Untitled document",
          content: "",
          workspaceId: publicEnv.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID
        })
      });

      const payload = (await response.json().catch(() => ({}))) as { document?: { id: string } };

      if (!response.ok || !payload.document?.id) {
        setIsCreating(false);
        return;
      }

      router.push(`/editor?docId=${payload.document.id}`);
      router.refresh();
    } catch {
      setIsCreating(false);
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
    } finally {
      router.push("/auth");
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/90 text-primary-foreground">
            <FileText className="h-4 w-4" />
          </span>
          <span>WriterFlow</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link href="/dashboard">Dashboard</Link>
          </Button>

          <Button size="sm" className="rounded-lg" disabled={isCreating || !isAuthenticated} onClick={() => void createDocument()}>
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isCreating ? "Creating..." : "New document"}
          </Button>

          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-muted text-xs font-semibold text-foreground">
            {avatarLabel}
          </span>

          <Button variant="ghost" size="sm" className="rounded-lg" disabled={isLoggingOut || !isAuthenticated} onClick={() => void logout()}>
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Signing out..." : "Logout"}
          </Button>
        </div>
      </div>
    </header>
  );
}