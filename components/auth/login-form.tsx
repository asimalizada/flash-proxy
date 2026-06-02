"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "@/components/auth/login.module.css";

type LoginFormProps = {
  redirectTo: string;
};

type LoginResponse = {
  success: boolean;
  error?: {
    message?: string;
  };
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [apiKey, setApiKey] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });
      const payload = (await response.json()) as LoginResponse;

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to sign in");
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className={`${styles.loginFormReveal} space-y-5`}
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="apiKey">API key</Label>
        <Input
          autoComplete="off"
          className="h-12 bg-background/65 shadow-sm backdrop-blur"
          id="apiKey"
          name="apiKey"
          placeholder="fp_live_..."
          spellCheck={false}
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
        />
      </div>

      <div className="min-h-6">
        {error ? (
          <p className="text-sm font-medium text-destructive">{error}</p>
        ) : null}
      </div>

      <Button className="h-12 w-full" disabled={isSubmitting || !apiKey.trim()}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
