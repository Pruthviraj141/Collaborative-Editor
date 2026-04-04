"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "signup";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const next = useMemo(() => {
    const requested = searchParams.get("next");
    return requested && requested.startsWith("/") ? requested : "/dashboard";
  }, [searchParams]);

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Authentication failed");
        return;
      }

      setMessage(mode === "signup" ? "Account created successfully." : "Login successful.");
      setIsSuccess(true);
    } catch {
      setError("Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    const timer = setTimeout(() => {
      router.push(next);
      router.refresh();
    }, 420);

    return () => clearTimeout(timer);
  }, [isSuccess, next, router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md rounded-2xl border-border/70 shadow-sm animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">{mode === "login" ? "Sign in to WriterFlow" : "Create your account"}</CardTitle>
          <CardDescription>Secure access required for all documents and collaboration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          <label htmlFor="username" className="sr-only">
            Username
          </label>
          <Input
            id="username"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            disabled={isSubmitting}
            aria-label="Username"
          />
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            disabled={isSubmitting}
            aria-label="Password"
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? (
            <p className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className={`h-4 w-4 transition-all duration-300 ${isSuccess ? "scale-100 opacity-100" : "scale-75 opacity-0"}`} />
              {message}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === "login" ? "default" : "outline"}
              onClick={() => setMode("login")}
              disabled={isSubmitting}
              className="h-10 rounded-lg"
            >
              Login
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "outline"}
              onClick={() => setMode("signup")}
              disabled={isSubmitting}
              className="h-10 rounded-lg"
            >
              Signup
            </Button>
          </div>

          <Button type="button" className="h-10 w-full rounded-lg disabled:opacity-50" disabled={isSubmitting || !username || !password} onClick={() => void submit()}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
          <Card className="w-full max-w-md rounded-2xl border-border/70 p-6 shadow-sm">
            <div className="skeleton h-7 w-56 rounded-md" />
            <div className="skeleton mt-3 h-4 w-72 rounded-md" />
            <div className="skeleton mt-6 h-10 w-full rounded-lg" />
            <div className="skeleton mt-3 h-10 w-full rounded-lg" />
          </Card>
        </main>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
