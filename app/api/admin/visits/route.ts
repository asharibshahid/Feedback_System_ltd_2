import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-static";

const VISIT_COLUMNS = [
  "id",
  "created_at",
  "full_name",
  "mobile",
  "company",
  "visit_type",
  "host_name",
  "purpose",
  "status",
  "visit_date",
  "selfie_url",
] as const;

type VisitRecord = {
  id: string;
  created_at: string;
  full_name: string;
  mobile: string;
  company: string | null;
  visit_type: string | null;
  host_name: string | null;
  purpose: string | null;
  status: string;
  visit_date: string | null;
  selfie_url: string | null;
};

function startOfTodayIso(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

function getRangeStart(range: string): string | null {
  const upper = range.toLowerCase();

  if (upper === "today") return startOfTodayIso();

  if (upper === "7d") {
    const now = new Date();
    now.setDate(now.getDate() - 6);
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }

  if (upper === "30d") {
    const now = new Date();
    now.setDate(now.getDate() - 29);
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }

  return null;
}

function normalizeSelfiePath(path: string): string {
  let p = path.trim();

  // remove leading slashes
  p = p.replace(/^\/+/, "");

  // if they stored "visitor-selfies/<file>", strip the bucket prefix
  p = p.replace(/^visitor-selfies\//, "");

  return p;
}

async function resolveSelfieUrl(
  supabase: SupabaseClient,
  selfieUrlOrPath: string | null,
): Promise<string | null> {
  if (!selfieUrlOrPath) return null;

  const raw = selfieUrlOrPath.trim();
  if (!raw) return null;

  // already a full URL: DO NOT modify
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const normalizedPath = normalizeSelfiePath(raw);

  // public bucket case
  const publicResult = supabase.storage.from("visitor-selfies").getPublicUrl(normalizedPath);
  const publicUrl = publicResult.data?.publicUrl ?? null;
  if (publicUrl) return publicUrl;

  // private bucket fallback
  const signedResult = await supabase.storage
    .from("visitor-selfies")
    .createSignedUrl(normalizedPath, 60 * 10);

  if (signedResult.error) return null;
  return signedResult.data?.signedUrl ?? null;
}

function isVisitRecord(x: unknown): x is VisitRecord {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;

  const isNullableOrString = (value: unknown): value is string | null =>
    value === null || typeof value === "string";

  return (
    typeof obj.id === "string" &&
    typeof obj.created_at === "string" &&
    typeof obj.full_name === "string" &&
    typeof obj.mobile === "string" &&
    isNullableOrString(obj.company) &&
    isNullableOrString(obj.visit_type) &&
    isNullableOrString(obj.host_name) &&
    isNullableOrString(obj.purpose) &&
    typeof obj.status === "string" &&
    isNullableOrString(obj.visit_date) &&
    ("selfie_url" in obj) &&
    isNullableOrString(obj.selfie_url)
  );
}

export async function GET() {
  const q: string = "";
  const status: string = "all";
  const purpose: string = "all";
  const range: string = "all";
  const limit: number = 200;

  const supabase = getSupabaseAdmin();

  // IMPORTANT: do not force generics on from(); it causes TS to infer error unions in some setups.
  let query = supabase
    .from("visits")
    .select(VISIT_COLUMNS.join(", "))
    .order("created_at", { ascending: false })
    .limit(limit);

  if (q) {
    // Escape % so ilike pattern doesn't break
    const safeQ = q.replace(/%/g, "\\%");
    const pattern = `%${safeQ}%`;
    query = query.or(`full_name.ilike.${pattern},mobile.ilike.${pattern}`);
  }

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (purpose !== "all") {
    query = query.eq("purpose", purpose);
  }

  const rangeStart = getRangeStart(range);
  if (rangeStart) {
    query = query.gte("created_at", rangeStart);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const raw: unknown = data;
  const rows: VisitRecord[] = Array.isArray(raw) ? raw.filter(isVisitRecord) : [];

  const enriched = await Promise.all(
    rows.map(async (row) => {
      const selfie_display_url = await resolveSelfieUrl(supabase, row.selfie_url);
      console.log("[API] visit id:", row.id, "selfie_url:", row.selfie_url);
      console.log("[API] computed selfie display url:", selfie_display_url);
      return { ...row, selfie_display_url };
    }),
  );

  return NextResponse.json({ data: enriched });
}

