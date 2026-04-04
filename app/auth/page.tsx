"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      router.push(next);
      router.refresh();
    } catch {
      setError("Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md rounded-2xl border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">{mode === "login" ? "Sign in to WriterFlow" : "Create your account"}</CardTitle>
          <CardDescription>Secure access required for all documents and collaboration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          <Input
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            disabled={isSubmitting}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            disabled={isSubmitting}
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

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

          <Button type="button" className="h-10 w-full rounded-lg" disabled={isSubmitting || !username || !password} onClick={() => void submit()}>
            {isSubmitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
