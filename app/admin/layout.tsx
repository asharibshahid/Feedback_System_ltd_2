"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { isAdminAuthenticated, logoutAdmin } from "@/lib/adminAuth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const authed = isAdminAuthenticated();
    if (!authed) {
      router.replace("/login");
      return;
    }
    setChecking(false);
  }, [router, pathname]);

  const handleLogout = () => {
    logoutAdmin();
    router.replace("/login");
  };

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--bm-text-soft)]">
        Checking access...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-6">
        <div className="text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Admin access</div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-[12px] border border-[color:var(--bm-primary)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]"
        >
          Logout
        </button>
      </div>
      {children}
    </div>
  );
}

