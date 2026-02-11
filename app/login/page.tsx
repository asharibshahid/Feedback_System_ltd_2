"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { adminAuthConfig, isAdminAuthenticated, loginAdmin } from "@/lib/adminAuth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAdminAuthenticated()) {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = loginAdmin(email, password);
    if (!result.ok) {
      setError(result.error ?? "Invalid email or password.");
      setSubmitting(false);
      return;
    }

    router.replace("/admin/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--bm-bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-[color:var(--bm-border)] bg-white/90 p-6 shadow-[0_30px_80px_rgba(31,27,24,0.12)] backdrop-blur">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Admin access</p>
          <h1 className="text-2xl font-semibold text-[color:var(--bm-text)]">Sign in</h1>
          <p className="text-sm text-[color:var(--bm-text-muted)]">Use your admin credentials to access secure pages.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="grid gap-2 text-sm font-semibold text-[color:var(--bm-text)]">
            <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-[14px] border border-[color:var(--bm-border)] bg-white px-3 py-2 text-sm text-[color:var(--bm-text)] focus:border-[color:var(--bm-accent)] focus:ring-2 focus:ring-[color:var(--bm-accent)]"
              placeholder={adminAuthConfig.ADMIN_EMAIL}
              autoComplete="username"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[color:var(--bm-text)]">
            <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-[14px] border border-[color:var(--bm-border)] bg-white px-3 py-2 text-sm text-[color:var(--bm-text)] focus:border-[color:var(--bm-accent)] focus:ring-2 focus:ring-[color:var(--bm-accent)]"
              placeholder="********"
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <div className="rounded-[14px] border border-[color:var(--bm-accent)] bg-[color:var(--bm-accent-soft)] px-3 py-2 text-sm text-[color:var(--bm-accent)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-[14px] bg-[color:var(--bm-accent)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_20px_45px_rgba(222,66,38,0.35)] transition hover:bg-[color:var(--bm-accent-hover)] disabled:cursor-not-allowed disabled:bg-[color:var(--bm-border)]"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
