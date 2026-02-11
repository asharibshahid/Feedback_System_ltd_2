import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[color:var(--bm-bg)] px-4 py-10 text-center">
      <h1 className="text-4xl font-semibold text-brand">Premium Visitor Experience</h1>
      <p className="max-w-2xl text-sm text-[color:var(--bm-text-muted)]">
        Fast, professional visitor registrations with clear navigation between the guest flow and the admin command console.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/visitor/checkin"
          className="rounded-full bg-brand bg-brand-hover px-6 py-3 text-sm font-semibold text-white transition"
        >
          Start Check-in
        </Link>
        <Link
          href="/admin"
          className="rounded-full border border-brand bg-white px-6 py-3 text-sm font-semibold text-brand transition hover:bg-brand-soft"
        >
          Admin
        </Link>
      </div>
    </div>
  );
}
