"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { ScrollPanel } from "@/components/ui/ScrollPanel";
import { Dialog } from "@/components/ui/shadcn/Dialog";
import { Sheet } from "@/components/ui/shadcn/Sheet";
import { RadioGroup } from "@/components/ui/shadcn/RadioGroup";
import { Select } from "@/components/ui/shadcn/Select";
import { Switch } from "@/components/ui/shadcn/Switch";
import { healthQuestionItems, useVisitorFlow } from "@/components/visitor/VisitorFlowProvider";
import { SiteNormsChecklist } from "@/components/visitor/SiteNormsChecklist";
import type { VisitPayload } from "@/lib/types/visit";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { toDbStatus } from "@/lib/status";

const sectionLabels = [
  { id: "identity", label: "Identity" },
  { id: "visitDetails", label: "Visit details" },
  { id: "health", label: "Health" },
  { id: "selfie", label: "Selfie" },
  { id: "siteNorms", label: "Site norms" },
  { id: "consent", label: "Consent" },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

const purposeOptions = [
  { label: "Meeting", value: "Meeting" },
  { label: "Delivery", value: "Delivery" },
  { label: "Inspection", value: "Inspection" },
  { label: "Interview", value: "Interview" },
  { label: "Contractor", value: "Contractor" },
  { label: "Other", value: "Other" },
];

type ParsedSelfie = {
  blob: Blob;
  contentType: string;
  extension: string;
};

const createUuid = (): string => {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) {
    return randomUuid;
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const parseSelfieDataUrl = (dataUrl: string): ParsedSelfie => {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+\-\.]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid selfie data URL.");
  }
  const [, mimeType, base64] = match;
  const extension = mimeType.split("/")[1].split("+")[0] || "jpg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return {
    blob: new Blob([bytes], { type: mimeType }),
    contentType: mimeType,
    extension,
  };
};

const entryLaneOptions = [
  { label: " BAKEMATE FACTORY JEDDAH ", value: " BAKEMATE FACTORY JEDDAH " },
  { label: "AAA HEADOFFICE JEDDAH", value: "AAA HEADOFFICE JEDDAH" },
  { label: "AAA HEADOFFICE RIYADH", value: "AAA HEADOFFICE RIYADH" },
  
];

const progressRadius = 56;
const progressCircumference = 2 * Math.PI * progressRadius;

type SmartHint = {
  title: string;
  detail: string;
  sectionIndex: number;
  tone: "info" | "warning" | "success";
  buttonLabel: string;
};

const buildTestimonialLink = (visitId: string) => {
  if (typeof window !== "undefined" && window.location.origin) {
    return `${window.location.origin}/testimonial?visitId=${visitId}`;
  }
  return `/testimonial?visitId=${visitId}`;
};

const queueWhatsAppNotification = (phone: string, link: string) => {
  // TODO(whatsapp): send a WhatsApp message to phone with the feedback link.
  void phone;
  void link;
};

export default function VisitorCheckinPage() {
  const router = useRouter();
  const {
    identity,
    visitDetails,
    health,
    selfie,
    consent,
    updateIdentity,
    updateVisitDetails,
    updateHealth,
    updateSelfie,
    updateConsent,
    markSubmitted,
  } = useVisitorFlow();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [cameraState, setCameraState] = useState<"idle" | "starting" | "active" | "error">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allNormsAccepted, setAllNormsAccepted] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const identityRef = useRef<HTMLDivElement>(null);
  const visitDetailsRef = useRef<HTMLDivElement>(null);
  const healthRef = useRef<HTMLDivElement>(null);
  const selfieRef = useRef<HTMLDivElement>(null);
  const siteNormsRef = useRef<HTMLDivElement>(null);
  const consentRef = useRef<HTMLDivElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const meetingRef = useRef<HTMLInputElement>(null);
  const otherPurposeRef = useRef<HTMLInputElement>(null);
  const consentCheckboxRef = useRef<HTMLInputElement>(null);

  const isEmailValid = useMemo(() => {
    const value = identity.email.trim();
    return value.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }, [identity.email]);

  const identityComplete = useMemo(
    () => identity.fullName.trim().length > 0 && identity.mobile.trim().length > 0 && isEmailValid,
    [identity.fullName, identity.mobile, isEmailValid],
  );

  const visitDetailsComplete = useMemo(() => {
    if (!visitDetails.meetingWith.trim()) {
      return false;
    }
    if (visitDetails.purpose === "Other" && !visitDetails.otherPurpose.trim()) {
      return false;
    }
    return true;
  }, [visitDetails.meetingWith, visitDetails.purpose, visitDetails.otherPurpose]);

  const selfieComplete = Boolean(selfie.snapshot);
  const consentComplete = consent;
  const healthAlert = useMemo(() => Object.values(health).some(Boolean), [health]);

  const completionPercent = useMemo(() => {
    const flags = [identityComplete, visitDetailsComplete, selfieComplete, allNormsAccepted, consentComplete];
    return Math.round((flags.filter(Boolean).length / flags.length) * 100);
  }, [identityComplete, visitDetailsComplete, selfieComplete, allNormsAccepted, consentComplete]);

  const isAllComplete = identityComplete && visitDetailsComplete && selfieComplete && allNormsAccepted && consentComplete;

  const smartHint = useMemo<SmartHint>(() => {
    if (!identityComplete) {
      return {
        title: "Identity incomplete",
        detail: "Add your full name and mobile so the gate team can issue a badge instantly.",
        sectionIndex: 0,
        tone: "warning",
        buttonLabel: "Finish identity",
      };
    }
    if (!visitDetailsComplete) {
      return {
        title: "Visit details in review",
        detail: "Select a host, purpose, and entry lane before moving forward.",
        sectionIndex: 1,
        tone: "warning",
        buttonLabel: "Describe visit",
      };
    }
    if (healthAlert) {
      return {
        title: "Health flags detected",
        detail: "An alert was raised. HACCP may review before granting access.",
        sectionIndex: 2,
        tone: "warning",
        buttonLabel: "Review health",
      };
    }
    if (!selfie.snapshot) {
      return {
        title: "Selfie missing",
        detail: "Capture your photo so the security team can confirm your identity.",
        sectionIndex: 3,
        tone: "info",
        buttonLabel: "Grab selfie",
      };
    }
    if (!consentComplete) {
      return {
        title: "Consent required",
        detail: "Authorize data usage to unlock the submit control.",
        sectionIndex: 5,
        tone: "info",
        buttonLabel: "Grant consent",
      };
    }
    return {
      title: "Ready for the gate",
      detail: "All sections are aligned. Hit submit when ready.",
      sectionIndex: 5,
      tone: "success",
      buttonLabel: "Submit now",
    };
  }, [allNormsAccepted, consentComplete, healthAlert, identityComplete, visitDetailsComplete, selfie.snapshot]);

  const progressOffset = progressCircumference - (completionPercent / 100) * progressCircumference;

  const scrollToSection = useCallback((index: number) => {
    const targets = [identityRef, visitDetailsRef, healthRef, selfieRef, siteNormsRef, consentRef];
    const target = targets[index]?.current;
    const container = scrollContainerRef.current;
    if (!container || !target) return;
    const scrollTop = target.offsetTop - container.offsetTop + container.scrollTop - 12;
    container.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
    setActiveSection(index);
  }, []);

  const focusSectionInput = useCallback(
    (index: number) => {
      if (index === 0) {
        if (!identity.fullName.trim()) {
          fullNameRef.current?.focus();
        } else if (!isEmailValid) {
          emailRef.current?.focus();
        } else {
          mobileRef.current?.focus();
        }
      }
      if (index === 1) {
        if (!visitDetails.meetingWith.trim()) {
          meetingRef.current?.focus();
        } else if (visitDetails.purpose === "Other" && !visitDetails.otherPurpose.trim()) {
          otherPurposeRef.current?.focus();
        }
      }
      if (index === 4) {
        consentCheckboxRef.current?.focus();
      }
    },
    [identity.fullName, isEmailValid, visitDetails.meetingWith, visitDetails.otherPurpose, visitDetails.purpose],
  );

  const highlightSection = useCallback((index: number) => {
    setHighlightedSection(index);
    setTimeout(() => setHighlightedSection(null), 1400);
  }, []);

  const isSectionComplete = useCallback(
    (index: number) => {
      if (index === 0) return identityComplete;
      if (index === 1) return visitDetailsComplete;
      if (index === 2) return true;
      if (index === 3) return selfieComplete;
      if (index === 4) return allNormsAccepted;
      if (index === 5) return consentComplete;
      return false;
    },
    [identityComplete, visitDetailsComplete, selfieComplete, allNormsAccepted, consentComplete],
  );

  const handleInvalidSection = useCallback(
    (index: number) => {
      scrollToSection(index);
      highlightSection(index);
      focusSectionInput(index);
      setValidationMessage("Please fill the highlighted section before moving on.");
    },
    [focusSectionInput, highlightSection, scrollToSection],
  );

  const firstIncompleteSection = useMemo(
    () => [0, 1, 2, 3, 4, 5].find((index) => !isSectionComplete(index)),
    [isSectionComplete],
  );

  const startCamera = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraState("error");
      setCameraError("Camera access is not supported on this device.");
      return;
    }

    if (!window.isSecureContext) {
      setCameraState("error");
      setCameraError("Camera requires a secure (HTTPS) context. Please switch to a secure connection.");
      return;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    setCameraState("starting");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
        audio: false,
      });
      streamRef.current = mediaStream;
      setCameraState("active");
      setCameraError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => undefined);
      }
    } catch (error) {
      const message =
        error instanceof DOMException
          ? error.name === "NotAllowedError" || error.name === "SecurityError"
            ? "Camera permission was denied. Click 'Enable camera' to retry."
            : error.name === "NotFoundError"
              ? "No camera devices detected."
              : "Unable to start the camera at this time."
          : "Camera stream failed to load.";
      setCameraState("error");
      setCameraError(message);
    }
  }, []);

  const handleCapture = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    const videoWidth = videoRef.current.videoWidth || 720;
    const videoHeight = videoRef.current.videoHeight || 1280;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    updateSelfie(dataUrl);
  }, [updateSelfie]);

  const handleRetake = useCallback(() => {
    updateSelfie(null);
    startCamera();
  }, [startCamera, updateSelfie]);

  useEffect(() => {
    if (!visitDetails.entryLane) {
      const defaultLane = entryLaneOptions[0]?.value ?? "";
      if (defaultLane) {
        updateVisitDetails({ entryLane: defaultLane });
      }
    }
  }, [updateVisitDetails, visitDetails.entryLane]);

  const handleSubmit = useCallback(async () => {
    if (!isAllComplete) {
      if (firstIncompleteSection !== undefined) {
        handleInvalidSection(firstIncompleteSection);
      }
      return;
    }
    setValidationMessage(null);
    setSubmitError(null);
    setIsSaving(true);

    const companyValue = identity.company.trim();
    const otherPurposeValue = visitDetails.otherPurpose.trim();
    const purposeValue = visitDetails.purpose === "Other" && otherPurposeValue ? otherPurposeValue : visitDetails.purpose;
    const locationToSave = visitDetails.entryLane || entryLaneOptions[0]?.value || "";

    const payload: VisitPayload = {
      fullName: identity.fullName.trim(),
      mobile: identity.mobile.trim(),
      email: identity.email.trim(),
      company: companyValue || undefined,
      visitType: visitDetails.purpose,
      hostName: visitDetails.meetingWith.trim(),
      purpose: purposeValue,
      purposeNotes: visitDetails.purpose === "Other" ? otherPurposeValue : undefined,
      entryLane: locationToSave,
      priority: visitDetails.priority,
      escortRequired: identity.escortRequired,
      smsUpdates: identity.alertsOptIn,
      healthAnswers: health,
      selfieDataUrl: selfie.snapshot,
      consentGiven: consent,
      date: visitDetails.date,
      status: toDbStatus("Review"),
    };

    try {
      const supabase = getSupabaseClient();
      let selfieUrl: string | null = null;

      if (payload.selfieDataUrl) {
        const { blob, contentType, extension } = parseSelfieDataUrl(payload.selfieDataUrl);
        const fileName = `selfies/${createUuid()}.${extension}`;
        const upload = await supabase.storage
          .from("visitor-selfies")
          .upload(fileName, blob, { contentType, upsert: false });
        if (upload.error) {
          throw upload.error;
        }
        selfieUrl = fileName;
      }

      const visitDate = new Date(payload.date);
      const visitDateIso = Number.isNaN(visitDate.getTime())
        ? new Date().toISOString()
        : visitDate.toISOString();

      const visitRecord = {
        full_name: payload.fullName,
        mobile: payload.mobile,
        visitor_email: payload.email,
        company: payload.company || null,
        visit_type: payload.visitType,
        host_name: payload.hostName,
        purpose: payload.purpose,
        purpose_notes: payload.purposeNotes || null,
        entry_lane: payload.entryLane,
        priority: payload.priority,
        escort_required: payload.escortRequired,
        sms_updates: payload.smsUpdates,
        health_answers: payload.healthAnswers,
        selfie_url: selfieUrl,
        consent_given: payload.consentGiven,
        status: payload.status ?? toDbStatus("Review"),
        visit_date: visitDateIso,
      };

      console.log("Saving location:", locationToSave);

      const { data, error } = await supabase
        .from("visits")
        .insert(visitRecord)
        .select("id")
        .single();

      if (error || !data?.id) {
        throw new Error(error?.message ?? "Unable to save visit.");
      }

      markSubmitted();
      // BEGIN send-email edge function call (fetch + public env vars)
      let emailFailed = false;
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
          emailFailed = true;
        } else {
          const formLink = buildTestimonialLink(data.id);
          const fnUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/send-email`;
          const response = await fetch(fnUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
              email: payload.email,
              name: payload.fullName,
              formLink,
            }),
          });
          if (!response.ok) {
            const errText = await response.text().catch(() => "");
            console.error("send-email failed", response.status, errText);
            emailFailed = true;
          }
        }
      } catch {
        emailFailed = true;
      }
      // END send-email edge function call (fetch + public env vars)
      const testimonialLink = buildTestimonialLink(data.id);
      queueWhatsAppNotification(payload.mobile, testimonialLink);
      router.push(`/visitor/thanks?visitId=${data.id}${emailFailed ? "&email=failed" : ""}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to save visit.";
      setSubmitError(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    consent,
    firstIncompleteSection,
    handleInvalidSection,
    health,
    identity.alertsOptIn,
    identity.company,
    identity.escortRequired,
    identity.email,
    identity.fullName,
    identity.mobile,
    isAllComplete,
    markSubmitted,
    router,
    selfie.snapshot,
    visitDetails.date,
    visitDetails.entryLane,
    visitDetails.meetingWith,
    visitDetails.otherPurpose,
    visitDetails.priority,
    visitDetails.purpose,
  ]);

  const handleNext = useCallback(() => {
    console.log("Next clicked", activeSection);
    setValidationMessage(null);
    if (isSaving) {
      return;
    }
    if (!isAllComplete) {
      if (firstIncompleteSection !== undefined) {
        handleInvalidSection(firstIncompleteSection);
        return;
      }
    }
    if (isAllComplete) {
      void handleSubmit();
      return;
    }
    const nextIndex = Math.min(activeSection + 1, sectionLabels.length - 1);
    scrollToSection(nextIndex);
    setActiveSection(nextIndex);
  }, [
    activeSection,
    firstIncompleteSection,
    handleInvalidSection,
    isAllComplete,
    isSaving,
    handleSubmit,
    scrollToSection,
  ]);

  const handleBack = useCallback(() => {
    const prevIndex = Math.max(0, activeSection - 1);
    scrollToSection(prevIndex);
  }, [activeSection, scrollToSection]);

  const nextButtonDisabled = isSaving || (activeSection === sectionLabels.length - 1 && !isAllComplete);
  const nextButtonLabel = isSaving ? "Submitting..." : isAllComplete ? "Submit" : "Next";

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const timer = window.setTimeout(() => setIsSecureContext(window.isSecureContext), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    if (typeof window !== "undefined") {
      timer = window.setTimeout(startCamera, 0);
    }
    return () => {
      if (typeof window !== "undefined" && timer) {
        window.clearTimeout(timer);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [startCamera]);

  useEffect(() => {
    if (!streamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = streamRef.current;
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return undefined;

    const refs = [identityRef, visitDetailsRef, healthRef, selfieRef, consentRef];
    const observer = new IntersectionObserver(
      (entries) => {
        let bestRatio = 0;
        let bestIndex = -1;
        entries.forEach((entry) => {
          const index = refs.findIndex((ref) => ref.current === entry.target);
          if (index === -1) return;
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        });
        if (bestIndex >= 0) {
          setActiveSection(bestIndex);
        }
      },
      { root: container, threshold: [0.25, 0.55, 0.9] },
    );

    refs.forEach((ref) => ref.current && observer.observe(ref.current));
    return () => observer.disconnect();
  }, []);

  const sectionStatus = (index: number) => {
    if (highlightedSection === index) {
      return "border-[color:var(--bm-accent)]";
    }
    if (activeSection === index) {
      return "border-[color:var(--bm-accent)]";
    }
    return "border-[color:var(--bm-border)]";
  };

  const hintToneStyles: Record<SmartHint["tone"], string> = {
    info: "border-[color:var(--bm-accent)] bg-[color:var(--bm-accent-soft)]",
    warning: "border-[color:var(--bm-accent)] bg-[color:var(--bm-accent-soft)]",
    success: "border-[color:var(--bm-primary)] bg-[color:var(--bm-primary-soft)]",
  };

  return (
    <div className="relative min-h-screen bg-[color:var(--bm-bg)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 pb-32">
        <header className="grid gap-5 rounded-[28px] border border-[color:var(--bm-border)] bg-white/70 p-6 shadow-[0_40px_80px_rgba(15,23,42,0.15)] backdrop-blur-3xl lg:grid-cols-[minmax(0,1fr)_200px]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Visitor command center</p>
            <h1 className="text-3xl font-semibold text-brand">Premium entrance intelligence</h1>
           
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--bm-text-muted)]">
              <span>{`Step ${activeSection + 1} of ${sectionLabels.length}`}</span>
              <span className="h-1 w-1 rounded-full bg-[color:var(--bm-text-muted)]" />
              <span>{completionPercent}% complete</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sectionLabels.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(index)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-semibold tracking-[0.4em] uppercase transition ${
                    activeSection === index
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-[color:var(--bm-border)] bg-white text-[color:var(--bm-text-soft)]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" aria-hidden />
                  {section.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-[20px] border border-white/70 bg-white/60 shadow-[0_25px_60px_rgba(15,23,42,0.2)] backdrop-blur-xl">
              <motion.svg viewBox="0 0 160 160" className="h-full w-full">
                <circle
                  cx="80"
                  cy="80"
                  r={progressRadius}
                  stroke="var(--bm-border)"
                  strokeWidth="14"
                  fill="transparent"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r={progressRadius}
                  stroke="var(--bm-accent)"
                  strokeLinecap="round"
                  strokeWidth="14"
                  fill="transparent"
                  strokeDasharray={progressCircumference}
                  strokeDashoffset={progressCircumference}
                  animate={{ strokeDashoffset: progressOffset }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[0.65rem] uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">ready</span>
                <span className="text-3xl font-semibold text-[color:var(--bm-accent)]">{completionPercent}%</span>
              </div>
            </div>
          </div>
        </header>
        <div className="flex flex-wrap gap-3 rounded-[20px] border border-[color:var(--bm-border)] bg-white/80 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--bm-text-muted)] shadow-sm">
          <Link href="/" className="rounded-full border border-brand bg-white px-4 py-2 text-[0.65rem] text-brand transition hover:bg-brand-soft">
            Back to landing
          </Link>
          <Link href="/visitor/thanks" className="rounded-full border border-accent bg-accent-soft px-4 py-2 text-[0.65rem] text-accent transition">
            Next: Thanks
          </Link>
          <Link href="/" className="rounded-full border border-brand bg-white px-4 py-2 text-[0.65rem] text-brand transition hover:bg-brand-soft">
            Exit
          </Link>
        </div>

        {validationMessage && (
          <div className="rounded-[20px] border border-[#FCA5A5] bg-[#FEF2F2] px-5 py-3 text-sm font-semibold text-[#B91C1C]">
            {validationMessage}
          </div>
        )}
        {submitError && (
          <div className="rounded-[20px] border border-[#FCA5A5] bg-[#FEF2F2] px-5 py-3 text-sm font-semibold text-[#B91C1C]">
            {submitError}
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-4">
              <ScrollPanel
                ref={scrollContainerRef}
                panelStyle={{ height: "78vh" }}
              panelClassName="space-y-6 pb-32"
              className="border border-white/70 bg-white/60"
            >
                {sectionLabels.map((section, index) => (
                <motion.section
                  key={section.id}
                  ref={
                    index === 0
                      ? identityRef
                      : index === 1
                        ? visitDetailsRef
                        : index === 2
                          ? healthRef
                          : index === 3
                            ? selfieRef
                            : consentRef
                  }
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.25 }}
                  variants={sectionVariants}
                  className={`relative overflow-hidden rounded-[28px] border ${sectionStatus(index)} bg-white/80 shadow-[0_25px_60px_rgba(15,23,42,0.12)] backdrop-blur-3xl`}
                >
                  <motion.div
                    animate={
                      highlightedSection === index
                        ? { x: [0, -5, 5, -5, 5, 0] }
                        : { x: 0 }
                    }
                    transition={{ duration: 0.45 }}
                    className="relative h-full"
                  >
                    {activeSection === index && (
                      <motion.span
                        className="pointer-events-none absolute inset-0 rounded-[28px]"
                        animate={{
                          boxShadow: [
                            "0 0 0px rgba(37,99,235,0)",
                            "0 0 30px rgba(37,99,235,0.25)",
                            "0 0 0px rgba(37,99,235,0)",
                          ],
                        }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    <GlassPanel className="space-y-5 bg-white/60 px-6 py-6">
                      {index === 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Identity</p>
                              <h2 className="text-xl font-semibold text-[color:var(--bm-text)]">Visitor identity</h2>
                            </div>
                            <motion.span
                              className="text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--bm-accent)]"
                              animate={{ scale: [0.95, 1.05, 0.95] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                            >
                              Proactive
                            </motion.span>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="grid gap-2 text-sm font-semibold text-[color:var(--bm-text)]">
                              <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Full name</span>
                              <input
                                ref={fullNameRef}
                                className="w-full rounded-[14px] border border-[color:var(--bm-border)] bg-white/80 px-3 py-2 text-sm text-[color:var(--bm-text)] ring-accent focus:ring-2"
                                value={identity.fullName}
                                onChange={(event) => updateIdentity({ fullName: event.target.value })}
                                placeholder="Avery Lane"
                              />
                            </label>
                            <label className="grid gap-2 text-sm font-semibold text-[color:var(--bm-text)]">
                              <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Mobile</span>
                              <input
                                ref={mobileRef}
                                type="tel"
                                className="w-full rounded-[14px] border border-[color:var(--bm-border)] bg-white/80 px-3 py-2 text-sm text-[color:var(--bm-text)] ring-accent focus:ring-2"
                                value={identity.mobile}
                                onChange={(event) => updateIdentity({ mobile: event.target.value })}
                                placeholder="+1 555 012 345"
                              />
                            </label>
                          </div>
                          <label className="grid gap-2 text-sm font-semibold text-[color:var(--bm-text)]">
                            <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Email (Required)</span>
                            <input
                              ref={emailRef}
                              type="email"
                              required
                              autoComplete="email"
                              className="w-full rounded-[14px] border border-[color:var(--bm-border)] bg-white/80 px-3 py-2 text-sm text-[color:var(--bm-text)] ring-accent focus:ring-2"
                              value={identity.email}
                              onChange={(event) => updateIdentity({ email: event.target.value })}
                              placeholder="you@example.com"
                              aria-invalid={identity.email.trim().length > 0 && !isEmailValid}
                            />
                            {identity.email.trim().length > 0 && !isEmailValid && (
                              <span className="text-xs font-medium text-[#B91C1C]">Enter a valid email address.</span>
                            )}
                          </label>
                          <label className="grid gap-2 text-sm font-semibold text-[color:var(--bm-text)]">
                            <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Company (Mandatory)</span>
                            <input
                              className="w-full rounded-[14px] border border-[color:var(--bm-border)] bg-white/80 px-3 py-2 text-sm text-[color:var(--bm-text)] ring-accent focus:ring-2"
                              value={identity.company}
                              onChange={(event) => updateIdentity({ company: event.target.value })}
                              placeholder="Northwind Logistics"
                            />
                          </label>
                          <div className="grid gap-3 md:grid-cols-2">
                            <Switch
                              label="Require escort"
                              description="Notify the safety team if an escort is mandated."
                              checked={identity.escortRequired}
                              onCheckedChange={(value) => updateIdentity({ escortRequired: value })}
                            />
                            <Switch
                              label="SMS updates"
                              description="Receive gate alerts and arrival confirmations."
                              checked={identity.alertsOptIn}
                              onCheckedChange={(value) => updateIdentity({ alertsOptIn: value })}
                            />
                          </div>
                        </div>
                      )}
                      {index === 1 && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Visit details</p>
                              <h2 className="text-xl font-semibold text-[color:var(--bm-text)]">Purpose & host</h2>
                            </div>
                            <span className="text-xs text-[color:var(--bm-text-muted)]">Priority {visitDetails.priority}%</span>
                          </div>
                          <RadioGroup
                            label="Purpose"
                            value={visitDetails.purpose}
                            options={purposeOptions}
                            onValueChange={(value) => updateVisitDetails({ purpose: value })}
                          />
                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="grid gap-2 text-sm font-semibold text-[color:var(--bm-text)]">
                              <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Meeting with</span>
                              <input
                                ref={meetingRef}
                                className="w-full rounded-[14px] border border-[color:var(--bm-border)] bg-white/80 px-3 py-2 text-sm text-[color:var(--bm-text)] ring-accent focus:ring-2"
                                value={visitDetails.meetingWith}
                                onChange={(event) => updateVisitDetails({ meetingWith: event.target.value })}
                                placeholder="Avery Lane"
                              />
                            </label>
                            <Select
                              label="Preferred Visit Location"
                              value={visitDetails.entryLane}
                              options={entryLaneOptions}
                              onChange={(event) => updateVisitDetails({ entryLane: event.target.value })}
                            />
                          </div>
                          {visitDetails.purpose === "Other" && (
                            <label className="grid gap-2 text-sm font-semibold text-[color:var(--bm-text)]">
                              <span className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Other purpose</span>
                              <input
                                ref={otherPurposeRef}
                                className="w-full rounded-[14px] border border-[color:var(--bm-border)] bg-white/80 px-3 py-2 text-sm text-[color:var(--bm-text)] ring-accent focus:ring-2"
                                value={visitDetails.otherPurpose}
                                onChange={(event) => updateVisitDetails({ otherPurpose: event.target.value })}
                                placeholder="Describe reason"
                              />
                            </label>
                          )}
                          <div className="space-y-2 rounded-[20px] border border-[color:var(--bm-border)] bg-white/60 px-4 py-3 shadow-inner">
                            <div className="flex items-center justify-between text-sm font-semibold text-[color:var(--bm-text)]">
                              <span>Urgency slider</span>
                              <span className="text-xs text-[color:var(--bm-text-muted)]">{visitDetails.priority}% priority</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="100"
                              value={visitDetails.priority}
                              onChange={(event) => updateVisitDetails({ priority: Number(event.target.value) })}
                              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[color:var(--bm-border)] accent-[color:var(--bm-accent)]"
                            />
                            <div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">
                              <span>Routine</span>
                              <span>Priority</span>
                              <span>Critical</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {index === 2 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Health</p>
                              <h2 className="text-xl font-semibold text-[color:var(--bm-text)]">Questionnaire</h2>
                            </div>
                            {healthAlert && (
                              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-[#92400E]">Alert active</span>
                            )}
                          </div>
                          <div className="space-y-3">
                            {healthQuestionItems.map((question) => {
                              const value = health[question.key as keyof typeof health];
                              return (
                                <div
                                  key={question.key}
                                  className="flex flex-col gap-2 rounded-[18px] border border-[color:var(--bm-border)] bg-white/80 px-4 py-3 shadow-sm"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-[12px] bg-[color:var(--bm-primary-soft)]">
                                        <Image
                                          src={question.imageSrc}
                                          alt={question.label}
                                          fill
                                          sizes="40px"
                                          className="object-contain p-1.5"
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[color:var(--bm-text)]">{question.label}</p>
                                        <p className="text-[0.65rem] text-[color:var(--bm-text-muted)]">{question.helperText}</p>
                                      </div>
                                    </div>
                                    <div className="ml-auto flex shrink-0 flex-nowrap gap-2 whitespace-nowrap">
                                      {["yes", "no"].map((option) => {
                                        const isYes = option === "yes";
                                        const active = isYes ? value : !value;
                                        return (
                                          <button
                                            key={option}
                                            type="button"
                                            onClick={() => updateHealth(question.key as keyof typeof health, isYes)}
                                            className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.4em] transition sm:px-3 ${
                                              active
                                                ? "border-accent bg-accent-soft text-accent"
                                                : "border-[color:var(--bm-border)] bg-white text-[color:var(--bm-text-muted)]"
                                            }`}
                                          >
                                            {option}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {healthAlert && (
                              <div className="rounded-[18px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm font-semibold text-[#92400E]">
                                Entry to production may require a HACCP review. Notify your host immediately.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {index === 3 && (
                        <div className="space-y-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Visitor's Photo</p>
                              <h2 className="text-xl font-semibold text-[color:var(--bm-text)]">Selfie capture</h2>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDialogOpen(true)}
                              className="text-xs font-semibold text-[color:var(--bm-accent)] underline-offset-4 hover:underline"
                            >
                              Capture guide
                            </button>
                          </div>
                          {!isSecureContext && (
                            <div className="rounded-[18px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
                              Camera access requires HTTPS. Run the flow from a secure context.
                            </div>
                          )}
                          {cameraError && (
                            <div className="rounded-[18px] border border-[color:var(--bm-accent)] bg-[color:var(--bm-accent-soft)] px-4 py-3 text-sm text-[color:var(--bm-accent)]">
                              {cameraError}
                            </div>
                          )}
                          <div className="cameraCard">
                            <div className="cameraMediaLayer">
                              <div className="cameraFrame border border-[color:var(--bm-border)] bg-[color:var(--bm-primary-soft)]">
                                {selfie.snapshot ? (
                                  <Image
                                    src={selfie.snapshot}
                                    alt="Visitor selfie"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 360px"
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <video ref={videoRef} playsInline muted autoPlay className="mirror" />
                                )}
                              </div>
                            </div>
                            <div className="cameraActions">
                            <button
                              type="button"
                              onClick={handleCapture}
                              disabled={cameraState !== "active"}
                              className="rounded-[14px] bg-[color:var(--bm-accent)] px-5 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-white shadow-[0_15px_35px_rgba(222,66,38,0.35)] transition hover:bg-[color:var(--bm-accent-hover)] disabled:cursor-not-allowed disabled:bg-[color:var(--bm-border)] disabled:text-[color:var(--bm-text-soft)]"
                            >
                              Capture
                            </button>
                            <button
                              type="button"
                              onClick={handleRetake}
                            disabled={!selfie.snapshot}
                              className="rounded-[14px] border border-[color:var(--bm-primary)] bg-white/80 px-5 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)] disabled:opacity-40"
                            >
                              Retake
                            </button>
                            {cameraState !== "active" && (
                              <button
                                type="button"
                                onClick={startCamera}
                                className="rounded-[14px] border border-[color:var(--bm-primary)] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]"
                              >
                                Enable camera
                              </button>
                            )}
                            </div>
                          </div>
                        </div>
                      )}
                      {index === 4 && (
                        <div className="space-y-4">
                          <SiteNormsChecklist
                            onAllAcceptedChange={setAllNormsAccepted}
                          />
                        </div>
                      )}
                      {index === 5 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Consent</p>
                              <h2 className="text-xl font-semibold text-[color:var(--bm-text)]">Consent & review</h2>
                            </div>
                          </div>
                          <label className="flex items-start gap-3 rounded-[18px] border border-[color:var(--bm-border)] bg-white/80 px-4 py-3">
                            <input
                              ref={consentCheckboxRef}
                              type="checkbox"
                              checked={consent}
                              onChange={(event) => updateConsent(event.target.checked)}
                              className="mt-1 h-5 w-5 rounded border border-[color:var(--bm-border)] text-[color:var(--bm-accent)] focus:ring-[color:var(--bm-accent)]"
                            />
                            <span className="text-sm text-[color:var(--bm-text-muted)]">
                              I consent to my photo and visit details being recorded for badge issuance and safety oversight.
                            </span>
                          </label>
                          <p className="text-xs text-[color:var(--bm-text-soft)]">Consent must be granted before the submit action becomes available.</p>
                        </div>
                      )}
                    </GlassPanel>
                  </motion.div>
                </motion.section>
              ))}
            </ScrollPanel>
          </div>

          <aside className="hidden flex-col gap-4 lg:flex">
            <GlassPanel className={`space-y-3 ${hintToneStyles[smartHint.tone]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-muted)]">AI hints</p>
                  <h3 className="text-lg font-semibold text-[color:var(--bm-text)]">{smartHint.title}</h3>
                </div>
                <motion.span className="h-3 w-3 rounded-full bg-[color:var(--bm-accent)]" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
              </div>
              <p className="text-sm text-[color:var(--bm-text-muted)]">{smartHint.detail}</p>
              <button
                type="button"
                onClick={() => scrollToSection(smartHint.sectionIndex)}
                className="w-full rounded-[14px] border border-[color:var(--bm-primary)] bg-white/70 px-4 py-2 text-sm font-semibold text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]"
              >
                {smartHint.buttonLabel}
              </button>
            </GlassPanel>
            <GlassPanel className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Section tracker</p>
                <span className="text-xs text-[color:var(--bm-text-muted)]">Tap to jump</span>
              </div>
              <div className="space-y-2">
                {sectionLabels.map((section, index) => {
                  const complete = isSectionComplete(index);
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(index)}
                      className={`flex w-full items-center justify-between rounded-[16px] border px-3 py-2 text-left text-sm text-[color:var(--bm-text)] transition ${
                        activeSection === index ? "border-accent bg-accent-soft" : "border-[color:var(--bm-border)] bg-white/70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${complete ? "bg-[#16A34A]" : "bg-[color:var(--bm-border)]"}`} />
                        <div>
                          <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Step {index + 1}</p>
                          <p className="font-semibold text-[color:var(--bm-text)]">{section.label}</p>
                        </div>
                      </div>
                      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">
                        {complete ? "Done" : "Open"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </GlassPanel>
          </aside>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Capture guide">
        <p className="text-sm text-[color:var(--bm-text-muted)]">
          Center your face, keep a neutral expression, and ensure even lighting. Retake as needed for clarity.
        </p>
      </Dialog>
      <footer className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-auto">
        <div className="flex w-full max-w-3xl items-center justify-between gap-4 rounded-[24px] border border-[color:var(--bm-border)] bg-white/80 px-5 py-4 shadow-[0_35px_90px_rgba(31,27,24,0.25)] backdrop-blur-3xl">
          <button
            type="button"
            onClick={handleBack}
            disabled={activeSection === 0}
            className="rounded-[14px] border border-brand bg-white px-5 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-brand transition hover:bg-brand-soft disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => void handleNext()}
            disabled={nextButtonDisabled}
            className="rounded-[14px] bg-accent bg-accent-hover px-6 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-white shadow-[0_15px_45px_rgba(222,66,38,0.35)] transition disabled:cursor-not-allowed disabled:bg-[color:var(--bm-border)]"
          >
            {nextButtonLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}
