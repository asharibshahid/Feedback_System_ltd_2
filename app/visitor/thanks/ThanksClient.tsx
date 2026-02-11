"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { ScrollPanel } from "@/components/ui/ScrollPanel";
import { useVisitorFlow } from "@/components/visitor/VisitorFlowProvider";
import { getSupabaseClient } from "@/lib/supabaseClient";

type VisitRow = {
  id: string;
  full_name?: string | null;
  mobile?: string | null;
  company?: string | null;
  visitor_email?: string | null;
  visit_type?: string | null;
  host_name?: string | null;
  purpose?: string | null;
  purpose_notes?: string | null;
  entry_lane?: string | null;
  preferred_location?: string | null;
  facility?: string | null;
  location?: string | null;
  priority?: number | null;
  visit_date?: string | null;
  created_at?: string | null;
  health_answers?: Record<string, boolean> | null;
  selfie_url?: string | null;
  consent_given?: boolean | null;
  escort_required?: boolean | null;
  sms_updates?: boolean | null;
};

const isVisitRow = (value: unknown): value is VisitRow => {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === "string";
};

const normalizeHealthAnswers = (
  incoming: Record<string, boolean> | null | undefined,
  base: Record<string, boolean>,
) => {
  const normalized = { ...base };
  if (incoming && typeof incoming === "object") {
    Object.entries(incoming).forEach(([key, value]) => {
      if (Object.prototype.hasOwnProperty.call(normalized, key)) {
        normalized[key] = Boolean(value);
      }
    });
  }
  return normalized;
};

const deriveLocationLabel = (row: Partial<VisitRow>, fallback: string) => {
  const candidates = [
    row.preferred_location,
    row.facility,
    row.location,
    row.entry_lane,
    fallback,
  ];
  const selected = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  return selected ? selected.trim() : fallback;
};

const resolveSelfieUrl = async (
  supabase: SupabaseClient,
  selfieUrlOrPath: string | null | undefined,
): Promise<string | null> => {
  if (!selfieUrlOrPath) return null;
  const raw = selfieUrlOrPath.trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
    return raw;
  }
  const normalized = raw.replace(/^\/+/, "").replace(/^visitor-selfies\//, "");
  const { data: publicData } = supabase.storage.from("visitor-selfies").getPublicUrl(normalized);
  const publicUrl = publicData?.publicUrl ?? null;
  if (publicUrl) return publicUrl;
  const signedResult = await supabase.storage.from("visitor-selfies").createSignedUrl(normalized, 60 * 10);
  if (signedResult.error) return null;
  return signedResult.data?.signedUrl ?? null;
};

export default function ThanksClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { identity, visitDetails, health, selfie, consent, submitted } = useVisitorFlow();
  const [hydratedVisit, setHydratedVisit] = useState<{
    identity: typeof identity;
    visitDetails: typeof visitDetails;
    health: typeof health;
    selfie: typeof selfie;
    consent: boolean;
  } | null>(null);
  const [loadingVisit, setLoadingVisit] = useState(false);
  const [visitError, setVisitError] = useState<string | null>(null);

  const visitId = searchParams.get("id") ?? searchParams.get("visitId");
  const hasContextVisit = useMemo(
    () => submitted || Boolean(identity.fullName || visitDetails.meetingWith || selfie.snapshot),
    [identity.fullName, selfie.snapshot, submitted, visitDetails.meetingWith],
  );

  useEffect(() => {
    if (!visitId || hasContextVisit || hydratedVisit) return;

    const supabase = getSupabaseClient();
    let cancelled = false;

    const fetchVisit = async () => {
      setLoadingVisit(true);
      setVisitError(null);
      const primarySelect = [
        "id",
        "full_name",
        "mobile",
        "company",
        "visitor_email",
        "visit_type",
        "host_name",
        "purpose",
        "purpose_notes",
        "entry_lane",
        "preferred_location",
        "facility",
        "location",
        "priority",
        "visit_date",
        "created_at",
        "health_answers",
        "selfie_url",
        "consent_given",
        "escort_required",
        "sms_updates",
      ].join(", ");
      const fallbackSelect = [
        "id",
        "full_name",
        "mobile",
        "company",
        "visit_type",
        "host_name",
        "purpose",
        "purpose_notes",
        "entry_lane",
        "priority",
        "visit_date",
        "created_at",
        "health_answers",
        "selfie_url",
        "consent_given",
      ].join(", ");

      try {
        const { data: visitRow, error: visitError } = await supabase
          .from("visits")
          .select(primarySelect)
          .eq("id", visitId)
          .maybeSingle();

        let data: VisitRow | null = isVisitRow(visitRow) ? visitRow : null;
        let error: PostgrestError | null = visitError;

        if (!data) {
          const { data: visitorRow, error: visitorError } = await supabase
            .from("visitors")
            .select(primarySelect)
            .eq("id", visitId)
            .maybeSingle();
          data = isVisitRow(visitorRow) ? visitorRow : null;
          error = visitorError;
        }

        if (error || !data) {
          throw new Error(error?.message ?? "Unable to load visit record.");
        }

        const locationLabel =
          [data.entry_lane, data.preferred_location, data.facility, data.location].find(
            (value) => typeof value === "string" && value.trim().length > 0,
          )?.trim() || "—";
        const visitDate = data.visit_date ?? data.created_at ?? visitDetails.date;
        const selfieUrl = await resolveSelfieUrl(supabase, data.selfie_url ?? null);
        const normalizedHealth = normalizeHealthAnswers(data.health_answers, health);

        if (!cancelled) {
          setHydratedVisit({
            identity: {
              ...identity,
              fullName: data.full_name ?? identity.fullName,
              mobile: data.mobile ?? identity.mobile,
              email: data.visitor_email ?? identity.email,
              company: data.company ?? identity.company,
              escortRequired:
                typeof data.escort_required === "boolean"
                  ? data.escort_required
                  : identity.escortRequired,
              alertsOptIn:
                typeof data.sms_updates === "boolean" ? data.sms_updates : identity.alertsOptIn,
            },
            visitDetails: {
              ...visitDetails,
              purpose: data.visit_type ?? data.purpose ?? visitDetails.purpose,
              otherPurpose: data.purpose_notes ?? visitDetails.otherPurpose,
              meetingWith: data.host_name ?? visitDetails.meetingWith,
              date: visitDate,
              priority: typeof data.priority === "number" ? data.priority : visitDetails.priority,
              entryLane: locationLabel,
            },
            health: normalizedHealth,
            selfie: { snapshot: selfieUrl },
            consent: typeof data.consent_given === "boolean" ? data.consent_given : consent,
          });
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to load visit.";
          setVisitError(message);
        }
      } finally {
        if (!cancelled) {
          setLoadingVisit(false);
        }
      }
    };

    void fetchVisit();

    return () => {
      cancelled = true;
    };
  }, [
    consent,
    hasContextVisit,
    health,
    hydratedVisit,
    identity,
    selfie,
    visitDetails,
    visitId,
  ]);

  const activeIdentity = hydratedVisit?.identity ?? identity;
  const activeVisitDetails = hydratedVisit?.visitDetails ?? visitDetails;
  const activeHealth = hydratedVisit?.health ?? health;
  const activeSelfie = hydratedVisit?.selfie ?? selfie;
  const activeConsent = hydratedVisit?.consent ?? consent;

  const warnings = useMemo(
    () => Object.entries(activeHealth).filter(([, value]) => value),
    [activeHealth],
  );
  const timestamp = useMemo(() => {
    const parsed = new Date(activeVisitDetails.date);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [activeVisitDetails.date]);
  const emailFailed = searchParams.get("email") === "failed";
  const instructions = useMemo(() => {
    const list = [
      {
        title: "Badge collection",
        detail: "The security will handover the Visitor badge at the reception",
      },

      {
        title: warnings.length ? `Health alert: ${warnings[0][0]}` : "Health clearance",
        detail: warnings.length
          ? "The HACCP auditor will review your answers. Remain near the safety desk."
          : "No symptoms reported. You may access the Facility.",
      },
    ];
    return list;
  }, [warnings]);
  const dateLabel = timestamp.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeLabel = timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const locationLabel = activeVisitDetails.entryLane || "—";

  return (
    <div className="relative min-h-screen bg-[color:var(--bm-bg)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 pb-32">
        <header className="space-y-2">
          <div className="flex items-center justify-between rounded-[20px] border border-[color:var(--bm-border)] bg-white/70 px-5 py-3 shadow-[0_20px_60px_rgba(31,27,24,0.12)]">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Visitor wrap</p>
              <h1 className="text-3xl font-semibold text-[color:var(--bm-text)]">Command confirmed</h1>
            </div>
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7] text-2xl text-[#16A34A] shadow-[0_20px_50px_rgba(37,99,235,0.25)]"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              ?
            </motion.div>
          </div>
          <p className="text-sm text-[color:var(--bm-text-muted)]">
            The concerned person is notified of your arrival and will shortly be accompanying you at the reception
          </p>
        </header>
        {emailFailed && (
          <div className="rounded-[20px] border border-[#FDE68A] bg-[#FFFBEB] px-5 py-3 text-sm font-semibold text-[#92400E]">
            We could not send the email automatically. Please use the feedback link.
          </div>
        )}
        {loadingVisit && (
          <div className="rounded-[16px] border border-[color:var(--bm-border)] bg-white/70 px-4 py-2 text-xs text-[color:var(--bm-text-muted)]">
            Loading visit details...
          </div>
        )}
        {visitError && (
          <div className="rounded-[16px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-2 text-xs text-[#B91C1C]">
            {visitError}
          </div>
        )}
        <div className="flex flex-wrap gap-3 rounded-[20px] border border-[color:var(--bm-border)] bg-white/80 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--bm-text-muted)] shadow-sm">
          <Link href="/visitor/checkin" className="rounded-full border border-[color:var(--bm-primary)] bg-white px-4 py-2 text-[0.65rem] text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]">
            Back to check-in
          </Link>
          <Link href="/" className="rounded-full border border-[color:var(--bm-primary)] bg-white px-4 py-2 text-[0.65rem] text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]">
            Exit
          </Link>
        </div>

        <ScrollPanel
          panelStyle={{ height: "72vh" }}
          panelClassName="space-y-6"
          className="border border-white/70 bg-white/60 shadow-[0_35px_90px_rgba(15,23,42,0.25)]"
        >
          <GlassPanel className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Registered</p>
                <p className="text-2xl font-semibold text-[color:var(--bm-text)]">{timeLabel}</p>
                <p className="text-[0.65rem] text-[color:var(--bm-text-muted)]">{dateLabel}</p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Entry lane</p>
                <p className="text-2xl font-semibold text-[color:var(--bm-text)]">{locationLabel}</p>
                <p className="text-[0.65rem] text-[color:var(--bm-text-muted)]">Priority {activeVisitDetails.priority}%</p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Consent</p>
                <p className={`text-2xl font-semibold ${activeConsent ? "text-[#16A34A]" : "text-[#92400E]"}`}>
                  {activeConsent ? "Granted" : "Missing"}
                </p>
                <p className="text-[0.65rem] text-[color:var(--bm-text-muted)]">Data usage ok</p>
              </div>
            </div>
            <div className="rounded-[18px] border border-[color:var(--bm-border)] bg-white/80 px-4 py-3 text-sm text-[color:var(--bm-text-muted)]">
              Entry status: <span className="font-semibold text-[color:var(--bm-text)]">Awaiting escort</span>.Please stay at the reception to be accompanied.
            </div>
          </GlassPanel>

          <GlassPanel className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Visitor</p>
                <h2 className="text-xl font-semibold text-[color:var(--bm-text)]">{activeIdentity.fullName || "Guest"}</h2>
              </div>
              <span className="text-sm text-[color:var(--bm-text-muted)]">{activeIdentity.company || "Independent visitor"}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[18px] border border-[color:var(--bm-border)] bg-white/80 p-4 text-sm">
                <p className="text-[0.6rem] uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Mobile</p>
                <p className="text-base font-semibold text-[color:var(--bm-text)]">{activeIdentity.mobile || "-"}</p>
                <p className="text-[0.7rem] text-[color:var(--bm-text-muted)]">Meeting with {activeVisitDetails.meetingWith || "TBD"}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--bm-border)] bg-white/80 p-4 text-sm">
                <p className="text-[0.6rem] uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Purpose</p>
                <p className="text-base font-semibold text-[color:var(--bm-text)]">{activeVisitDetails.purpose}</p>
                {activeVisitDetails.purpose === "Other" && (
                  <p className="text-[0.7rem] text-[color:var(--bm-text-muted)]">Reason: {activeVisitDetails.otherPurpose || "-"}</p>
                )}
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Health & safety</p>
              <span className="text-xs text-[color:var(--bm-text-muted)]">{warnings.length ? `${warnings.length} alerts` : "All clear"}</span>
            </div>
            {warnings.length === 0 ? (
              <p className="text-sm text-[color:var(--bm-text-muted)]">All health questions answered Now. You are cleared for the facility.</p>
            ) : (
              <ul className="space-y-2 text-sm text-[#92400E]">
                {warnings.map(([question]) => (
                  <li key={question}>Alert: {question}</li>
                ))}
              </ul>
            )}
          </GlassPanel>

          <GlassPanel className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Instructions</p>
              <span className="text-xs text-[color:var(--bm-text-muted)]">Stay close to the blue line</span>
            </div>
            <div className="space-y-3">
              {instructions.map((instruction, index) => (
                <motion.div
                  key={instruction.title}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: (i: number) => ({
                      opacity: 1,
                      y: 0,
                      transition: { delay: i * 0.1, type: "spring", stiffness: 120 },
                    }),
                  }}
                  className="rounded-[18px] border border-[color:var(--bm-border)] bg-white/80 px-4 py-3 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">{instruction.title}</p>
                  <p className="text-sm text-[color:var(--bm-text-muted)]">{instruction.detail}</p>
                </motion.div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Selfie</p>
              <span className="text-xs text-[color:var(--bm-text-muted)]">Recorded snapshot</span>
            </div>
            <div className="relative h-48 overflow-hidden rounded-[20px] border border-[color:var(--bm-border)] bg-[color:var(--bm-primary-soft)]">
              {activeSelfie.snapshot ? (
                <Image
                  src={activeSelfie.snapshot}
                  alt="Captured selfie"
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[color:var(--bm-text-muted)]">No selfie recorded.</div>
              )}
            </div>
          </GlassPanel>
        </ScrollPanel>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/visitor/checkin")}
            className="rounded-[14px] border border-[color:var(--bm-primary)] bg-white px-5 py-2 text-sm font-semibold text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]"
          >
            New visitor
          </button>
        </div>
      </div>
    </div>
  );
}
