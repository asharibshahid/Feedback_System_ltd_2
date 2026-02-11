"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const baseLinks = [{ label: "Start Check-in", href: "/visitor/checkin" }];

const adminLinks = [
  { label: "Dashboard", href: "/admin" },
  { label: "Visitors", href: "/admin/visitors" },
  { label: "New Check-in", href: "/visitor/checkin" },
];

export function AppHeader() {
  const pathname = usePathname() ?? "/";
  const isAdmin = pathname.startsWith("/admin");
  const variantLinks = isAdmin ? adminLinks : [];

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--bm-border)] bg-[color:var(--bm-card)] px-4 py-3 shadow-sm backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--bm-text-muted)]">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/bake.png"
            alt="BakeMate"
            width={140}
            height={36}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {baseLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[12px] border border-brand bg-white px-4 py-2 text-xs text-brand transition hover:bg-brand-soft"
            >
              {link.label}
            </Link>
          ))}
          {variantLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[12px] border border-accent bg-accent-soft px-4 py-2 text-xs text-accent transition"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
