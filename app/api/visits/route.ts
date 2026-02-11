import { Buffer } from "buffer";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { VisitPayload } from "@/lib/types/visit";
import { normalizeStatus, toDbStatus } from "@/lib/status";

export const dynamic = "force-static";

const requiredFields: (keyof VisitPayload)[] = [
  "fullName",
  "mobile",
  "email",
  "visitType",
  "hostName",
  "purpose",
  "entryLane",
  "priority",
  "escortRequired",
  "smsUpdates",
  "healthAnswers",
  "consentGiven",
  "date",
];

type ParsedPayload = Omit<VisitPayload, "purposeNotes"> & {
  purposeNotes?: string;
};

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+\-\.]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid selfie data URL.");
  }
  const [, mimeType, base64] = match;
  const extension = mimeType.split("/")[1].split("+")[0];
  return {
    contentType: mimeType,
    base64,
    extension: extension || "jpg",
  };
}

function normalizeHealthAnswers(value: unknown) {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  const entries = Object.entries(value);
  return entries.reduce<Record<string, boolean>>((acc, [key, answer]) => {
    acc[key] = Boolean(answer);
    return acc;
  }, {});
}

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const incoming = rawBody as Record<string, unknown>;

  const payload: ParsedPayload = {
    fullName: String(incoming.fullName ?? "").trim(),
    mobile: String(incoming.mobile ?? "").trim(),
    email: String(incoming.email ?? "").trim(),
    company: String(incoming.company ?? "").trim(),
    visitType: String(incoming.visitType ?? "").trim(),
    hostName: String(incoming.hostName ?? "").trim(),
    purpose: String(incoming.purpose ?? "").trim(),
    purposeNotes: typeof incoming.purposeNotes === "string" ? incoming.purposeNotes.trim() : undefined,
    entryLane: String(incoming.entryLane ?? "").trim(),
    priority: Number(incoming.priority ?? 0),
    escortRequired: Boolean(incoming.escortRequired),
    smsUpdates: Boolean(incoming.smsUpdates),
    healthAnswers: normalizeHealthAnswers(incoming.healthAnswers),
    selfieDataUrl: typeof incoming.selfieDataUrl === "string" ? incoming.selfieDataUrl : null,
    consentGiven: Boolean(incoming.consentGiven),
    date: String(incoming.date ?? ""),
    status: String(incoming.status ?? "review"),
  };

  const missingFields = requiredFields.filter((field) => {
    const value = payload[field];
    return (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim().length === 0) ||
      (typeof value === "number" && Number.isNaN(value))
    );
  });

  if (missingFields.length) {
    return NextResponse.json(
      { error: `Missing required fields: ${missingFields.join(", ")}` },
      { status: 400 },
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  let selfieUrl: string | null = null;
  if (payload.selfieDataUrl) {
    try {
      const { base64, extension, contentType } = parseDataUrl(payload.selfieDataUrl);
      const buffer = Buffer.from(base64, "base64");
      const fileName = `visitor-selfies/${randomUUID()}.${extension}`;
      const upload = await supabaseAdmin.storage
        .from("visitor-selfies")
        .upload(fileName, buffer, {
          contentType,
          upsert: false,
        });
      if (upload.error) {
        throw upload.error;
      }
      selfieUrl = fileName;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload selfie.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const visitDate = new Date(payload.date);
  const visitDateIso = Number.isNaN(visitDate.getTime()) ? new Date().toISOString() : visitDate.toISOString();

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
    status: toDbStatus(normalizeStatus(payload.status)),
    visit_date: visitDateIso,
  };

  const { data, error } = await supabaseAdmin
    .from("visits")
    .insert(visitRecord)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to save visit." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
