"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Невірний email або пароль");
      setSubmitting(false);
      return;
    }
    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
          Email
        </span>
        <input
          required
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mt-1"
        />
      </label>
      <label className="block">
        <span className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
          Пароль
        </span>
        <input
          required
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input mt-1"
        />
      </label>
      {error && (
        <p className="rounded-sm border border-embroidery/40 bg-embroidery/10 px-3 py-2 text-xs text-bark">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? "Входимо…" : "Увійти"}
      </Button>
    </form>
  );
}
