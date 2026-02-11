"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { getSupabaseClient } from "@/lib/supabaseClient";

// ADDED: Client-only component extracted from page.tsx for static export safety
export default function TestimonialClient() {
  const searchParams = useSearchParams();
  const visitId = searchParams.get("visitId") ?? "";
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    const trimmedEmail = email.trim();
    const trimmedComment = comment.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    return Boolean(visitId && trimmedComment && emailValid);
  }, [comment, email, visitId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("visit_testimonials").insert({
        visit_id: visitId,
        email: email.trim(),
        rating,
        comment: comment.trim(),
      });

      if (error) {
        throw new Error(error.message);
      }

      setSubmitSuccess(true);
      setComment("");
      setRating(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to submit feedback.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--bm-bg)]">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
        <header className="space-y-2 rounded-[22px] border border-[color:var(--bm-border)] bg-white/80 px-6 py-5 shadow-[0_25px_60px_rgba(15,23,42,0.15)]">
          <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Testimonial</p>
          <h1 className="text-2xl font-semibold text-[color:var(--bm-text)]">Share your visit feedback</h1>
          <p className="text-sm text-[color:var(--bm-text-muted)]">
            Your feedback helps the team improve the visitor experience.
          </p>
        </header>

        {!visitId && (
          <div className="rounded-[18px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">
            Missing visit ID. Please use the link provided in your email.
          </div>
        )}
        {submitSuccess && (
          <div className="rounded-[18px] border border-[#86EFAC] bg-[#ECFDF3] px-4 py-3 text-sm font-semibold text-[#166534]">
            Thanks! Your feedback has been received.
          </div>
        )}
        {submitError && (
          <div className="rounded-[18px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">
            {submitError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[22px] border border-[color:var(--bm-border)] bg-white/80 px-6 py-6 shadow-[0_20px_55px_rgba(15,23,42,0.12)]"
        >
          <label className="grid gap-2 text-sm font-semibold text-[color:var(--bm-text)]">
            <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-[14px] border border-[color:var(--bm-border)] bg-white/90 px-3 py-2 text-sm text-[color:var(--bm-text)] ring-accent focus:ring-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[color:var(--bm-text)]">
            <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Rating (Optional)</span>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    rating === value
                      ? "border-[color:var(--bm-accent)] bg-[color:var(--bm-accent-soft)] text-[color:var(--bm-accent)]"
                      : "border-[color:var(--bm-border)] bg-white text-[color:var(--bm-text-muted)]"
                  }`}
                >
                  {value}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRating(null)}
                className="rounded-full border border-[color:var(--bm-border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--bm-text-muted)] transition hover:text-[color:var(--bm-text)]"
              >
                Clear
              </button>
            </div>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[color:var(--bm-text)]">
            <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Comment</span>
            <textarea
              required
              rows={5}
              className="w-full resize-none rounded-[16px] border border-[color:var(--bm-border)] bg-white/90 px-3 py-3 text-sm text-[color:var(--bm-text)] ring-accent focus:ring-2"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Share any comments about your visit."
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-[14px] bg-[color:var(--bm-accent)] px-5 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-white shadow-[0_15px_35px_rgba(222,66,38,0.35)] transition hover:bg-[color:var(--bm-accent-hover)] disabled:cursor-not-allowed disabled:bg-[color:var(--bm-border)] disabled:text-[color:var(--bm-text-soft)]"
          >
            {isSubmitting ? "Submitting..." : "Submit feedback"}
          </button>
          <p className="text-xs text-[color:var(--bm-text-muted)]">
            Visit ID: {visitId || "Missing"}
          </p>
        </form>

        <Link
          href="/"
          className="self-start rounded-full border border-[color:var(--bm-primary)] bg-white px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
