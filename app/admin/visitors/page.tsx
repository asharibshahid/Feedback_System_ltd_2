"use client"

import Link from "next/link";
import { SyntheticEvent, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { motion } from "framer-motion";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { SupabaseClient } from "@supabase/supabase-js";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { Sheet } from "@/components/ui/shadcn/Sheet";
import { Input } from "@/components/ui/shadcn/Input";
import { Select } from "@/components/ui/shadcn/Select";
import { healthQuestionItems } from "@/components/visitor/VisitorFlowProvider";
import { Visitor, purposeOptions } from "@/lib/mockVisitors";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { normalizeStatus as normalizeCanonicalStatus } from "@/lib/status";

type VisitorDetails = Visitor & {
  purposeNotes?: string | null;
  healthAnswers?: Record<string, boolean> | null;
  siteNormsAgreed?: boolean | null;
};

const columnHelper = createColumnHelper<VisitorDetails>();

const timeframeFilters = [
  { label: "All time", value: "all" },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
];

type VisitDbRow = {
  id: string;
  created_at: string | null;
  full_name: string | null;
  mobile: string | null;
  company: string | null;
  visit_type: string | null;
  host_name: string | null;
  purpose: string | null;
  purpose_notes: string | null;
  status: string | null;
  visit_date: string | null;
  health_answers: Record<string, boolean> | null;
  selfie_url: string | null;
};

type VisitRow = VisitDbRow & {
  selfie_display_url: string | null;
};

const isVisitDbRow = (value: unknown): value is VisitDbRow => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  const isNullableString = (field: unknown): field is string | null =>
    field === null || typeof field === "string";
  return (
    typeof row.id === "string" &&
    isNullableString(row.created_at) &&
    isNullableString(row.full_name) &&
    isNullableString(row.mobile) &&
    isNullableString(row.company) &&
    isNullableString(row.visit_type) &&
    isNullableString(row.host_name) &&
    isNullableString(row.purpose) &&
    isNullableString(row.purpose_notes) &&
    isNullableString(row.status) &&
    isNullableString(row.visit_date) &&
    (row.health_answers === null || typeof row.health_answers === "object") &&
    isNullableString(row.selfie_url)
  );
};

const normalizeSelfiePath = (path: string): string => {
  let normalized = path.trim();
  normalized = normalized.replace(/^\/+/, "");
  normalized = normalized.replace(/^visitor-selfies\//, "");
  return normalized;
};

const resolveSelfieUrl = async (
  supabase: SupabaseClient,
  selfieUrlOrPath: string | null,
): Promise<string | null> => {
  if (!selfieUrlOrPath) return null;
  const raw = selfieUrlOrPath.trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const normalizedPath = normalizeSelfiePath(raw);
  const publicResult = supabase.storage.from("visitor-selfies").getPublicUrl(normalizedPath);
  const publicUrl = publicResult.data?.publicUrl ?? null;
  if (publicUrl) return publicUrl;

  const signedResult = await supabase.storage
    .from("visitor-selfies")
    .createSignedUrl(normalizedPath, 60 * 10);
  if (signedResult.error) return null;
  return signedResult.data?.signedUrl ?? null;
};

const getRangeStart = (range: "all" | "week" | "month"): string | null => {
  if (range === "all") return null;
  const now = new Date();
  if (range === "week") {
    now.setDate(now.getDate() - 6);
  } else {
    now.setDate(now.getDate() - 29);
  }
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
};

const formatDateLabel = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" });
};

const formatTimeLabel = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const normalizeHealthAnswers = (value: unknown): Record<string, boolean> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, boolean>>(
    (acc, [key, answer]) => {
      acc[key] = Boolean(answer);
      return acc;
    },
    {},
  );
};

const mapRowToVisitor = (row: VisitRow): VisitorDetails => {
  const dateValue = row.visit_date ?? row.created_at ?? new Date().toISOString();
  const dateLabel = formatDateLabel(dateValue);
  const time = formatTimeLabel(dateValue);
  const purpose = row.purpose ?? row.visit_type ?? "Visit";
  const meetingWith = row.host_name ?? "TBD";

  return {
    id: row.id,
    name: row.full_name ?? "Visitor",
    mobile: row.mobile ?? "",
    company: row.company ?? "Independent visitor",
    purpose,
    meetingWith,
    status: normalizeCanonicalStatus(row.status),
    date: dateValue,
    dateLabel,
    time,
    selfieUrl: row.selfie_url ?? null,
    selfieDisplayUrl: row.selfie_display_url ?? null,
    purposeNotes: row.purpose_notes ?? null,
    healthAnswers: normalizeHealthAnswers(row.health_answers),
    siteNormsAgreed: null,
  };
};

const VisitorTable = ({ data, onView }: { data: VisitorDetails[]; onView: (visitor: VisitorDetails) => void }) => {
  const table = useReactTable({
    data,
    columns: [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => (
          <div className="text-sm font-semibold text-[color:var(--bm-text)]">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("mobile", {
        header: "Mobile",
        cell: (info) => <span className="text-xs text-[color:var(--bm-text-muted)]">{info.getValue()}</span>,
      }),
      columnHelper.accessor("company", {
        header: "Company",
        cell: (info) => <span className="text-xs text-[color:var(--bm-text-muted)]">{info.getValue()}</span>,
      }),
      columnHelper.accessor("purpose", {
        header: "Purpose",
        cell: (info) => <span className="text-xs font-semibold text-[color:var(--bm-accent)]">{info.getValue()}</span>,
      }),
      columnHelper.accessor("meetingWith", {
        header: "Meeting with",
        cell: (info) => <span className="text-xs text-[color:var(--bm-text-muted)]">{info.getValue()}</span>,
      }),
      columnHelper.accessor("dateLabel", {
        header: "Date",
        cell: (info) => <span className="text-xs text-[color:var(--bm-text-muted)]">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <button
            type="button"
            onClick={() => onView(info.row.original)}
            className="rounded-[12px] border border-[color:var(--bm-primary)] bg-white px-4 py-1 text-xs font-semibold text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]"
          >
            View
          </button>
        ),
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
        <thead className="text-[0.7rem] uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border-b border-[color:var(--bm-border)] px-4 py-3">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <motion.tr
              key={row.id}
              className="cursor-pointer border-b border-[#F1F5F9] bg-white transition hover:bg-[color:var(--bm-accent-soft)]"
              whileHover={{ translateX: 2 }}
              onClick={() => onView(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-4">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function AdminVisitorsPage() {
  const [search, setSearch] = useState("");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [timeframeFilter, setTimeframeFilter] = useState<"all" | "week" | "month">("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailVisitor, setDetailVisitor] = useState<VisitorDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [visitorsData, setVisitorsData] = useState<VisitorDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const pageSize = 8;
  const filteredVisitors = visitorsData;

  useEffect(() => {
    if (detailVisitor) {
      console.log("[SelfiePreview] src:", detailVisitor.selfieDisplayUrl);
    } else {
      console.log("[SelfiePreview] src: null");
    }
  }, [detailVisitor]);

  const handleSelfieLoad = () => {
    if (detailVisitor?.selfieDisplayUrl) {
      console.log("[SelfiePreview] loaded:", detailVisitor.selfieDisplayUrl);
    }
  };

  const handleSelfieError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    if (detailVisitor) {
      console.error("[SelfiePreview] failed:", detailVisitor.selfieDisplayUrl);
    }
    const target = event.currentTarget;
    console.error("[SelfiePreview] img currentSrc:", target.currentSrc);
    console.error("[SelfiePreview] natural size:", target.naturalWidth, target.naturalHeight);
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchVisits = async () => {
      setLoading(true);
      setFetchError(null);

      const rangeMap: Record<string, string> = {
        all: "all",
        week: "7d",
        month: "30d",
      };
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("q", search.trim());
      }
      if (purposeFilter !== "all") {
        params.set("purpose", purposeFilter);
      }
      params.set("range", rangeMap[timeframeFilter]);
      params.set("limit", "200");

      try {
        const supabase = getSupabaseClient();
        let query = supabase
          .from("visits")
          .select(
            [
              "id",
              "created_at",
              "full_name",
              "mobile",
              "company",
              "visit_type",
              "host_name",
              "purpose",
              "purpose_notes",
              "status",
              "visit_date",
              "health_answers",
              "selfie_url",
            ].join(", "),
          )
          .order("created_at", { ascending: false })
          .limit(200);

        if (search.trim()) {
          const safeQ = search.trim().replace(/%/g, "\\%");
          const pattern = `%${safeQ}%`;
          query = query.or(`full_name.ilike.${pattern},mobile.ilike.${pattern}`);
        }
        if (purposeFilter !== "all") {
          query = query.eq("purpose", purposeFilter);
        }
        const rangeStart = getRangeStart(timeframeFilter);
        if (rangeStart) {
          query = query.gte("created_at", rangeStart);
        }

        const { data, error } = await query;
        if (error) {
          throw error;
        }

        const rawData: unknown = data;
        const rows: VisitDbRow[] = Array.isArray(rawData) ? rawData.filter(isVisitDbRow) : [];
        const enriched = await Promise.all(
          rows.map(async (row) => ({
            ...row,
            selfie_display_url: await resolveSelfieUrl(supabase, row.selfie_url),
          })),
        );

        enriched.forEach((row) => {
          console.log("[SelfiePreview] raw selfie_url from API:", row.selfie_url);
        });

        setVisitorsData(enriched.map(mapRowToVisitor));
      } catch (error: unknown) {
        setFetchError(error instanceof Error ? error.message : "Unable to load visits.");
      } finally {
        setLoading(false);
      }
    };

    void fetchVisits();
    return () => controller.abort();
  }, [search, purposeFilter, timeframeFilter]);

  const filteredPageCount = Math.max(1, Math.ceil(filteredVisitors.length / pageSize));

  useEffect(() => {
    let timer: number | undefined;
    if (typeof window !== "undefined") {
      timer = window.setTimeout(() => {
        setPageIndex((prev) => Math.min(prev, filteredPageCount - 1));
      }, 0);
    }
    return () => {
      if (typeof window !== "undefined" && timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [filteredPageCount]);

  const pagedVisitors = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredVisitors.slice(start, start + pageSize);
  }, [filteredVisitors, pageIndex, pageSize]);

  const handleExportSummary = async () => {
    if (!detailVisitor) return;

    const COLOR_COCOA: [number, number, number] = [90, 52, 38];
    const COLOR_ACCENT: [number, number, number] = [224, 68, 40];
    const COLOR_TEXT: [number, number, number] = [34, 34, 34];
    const COLOR_MUTED: [number, number, number] = [110, 110, 110];
    const COLOR_BORDER: [number, number, number] = [218, 205, 197];
    const SITE_NORMS_LINES = [
      "Wear company hair and beard covers",
      "Wash and sanitize hands at entrance",
      "Remove all jewelry and watches",
      "No drinking or eating (including chewing gum)",
      "No smoking",
      "All cuts must be covered with a suitable plaster",
    ];

    const formatFilenamePart = (value: string) =>
      value
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-_]/g, "")
        .toLowerCase();

    const fetchImageDataUrl = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Unable to load image.");
      }
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Unable to read image."));
        reader.readAsDataURL(blob);
      });
    };

    const getImageDimensions = (dataUrl: string) =>
      new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error("Unable to measure image."));
        image.src = dataUrl;
      });

    const drawHeader = async (doc: jsPDF, x: number, y: number, pageWidth: number) => {
      const title = "Visitor Summary";
      const generated = `Generated: ${new Date().toLocaleString("en-US")}`;
      const logoBox = { w: 90, h: 34 };
      const logoUrl = "/bake.png";

      try {
        const logoData = await fetchImageDataUrl(logoUrl);
        const { width, height } = await getImageDimensions(logoData);
        const scale = Math.min(logoBox.w / width, logoBox.h / height, 1);
        const renderW = width * scale;
        const renderH = height * scale;
        doc.addImage(logoData, "PNG", x, y, renderW, renderH, undefined, "FAST");
      } catch {
        // logo optional
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(...COLOR_COCOA);
      const titleWidth = doc.getTextWidth(title);
      const titleX = pageWidth - x - titleWidth;
      doc.text(title, titleX, y + 12);

      doc.setFontSize(10);
      doc.setTextColor(...COLOR_MUTED);
      const genWidth = doc.getTextWidth(generated);
      doc.text(generated, pageWidth - x - genWidth, y + 28);

      return Math.max(y + logoBox.h, y + 32);
    };

    type SectionRenderer = (startY: number, dryRun: boolean) => number;

    const drawSectionBox = (
      doc: jsPDF,
      params: { title: string; x: number; y: number; width: number },
      render: SectionRenderer,
    ) => {
      const headerH = 18;
      const bodyPad = 12;
      const contentStartY = params.y + headerH + bodyPad;
      const contentHeight = render(contentStartY, true);
      const totalH = headerH + bodyPad * 2 + contentHeight;

      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.6);
      doc.roundedRect(params.x, params.y, params.width, totalH, 8, 8);

      doc.setFillColor(...COLOR_ACCENT);
      doc.rect(params.x, params.y, params.width, headerH, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(params.title, params.x + 8, params.y + 12.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...COLOR_TEXT);
      render(contentStartY, false);

      return params.y + totalH + 14;
    };

    const drawKeyValueRows = (
      doc: jsPDF,
      rows: Array<[string, string]>,
      x: number,
      startY: number,
      width: number,
      dryRun: boolean,
    ) => {
      const lineGap = 18;
      const valueX = x + width * 0.45;
      const valueMaxWidth = width - (valueX - x) - 8;
      let cursorY = startY;
      rows.forEach(([label, value]) => {
        const valueText = doc.splitTextToSize(value || "-", valueMaxWidth);
        const rowHeight = Math.max(lineGap, valueText.length * 14);
        if (!dryRun) {
          doc.setFontSize(10);
          doc.setTextColor(...COLOR_MUTED);
          doc.text(label, x, cursorY);
          doc.setFontSize(11);
          doc.setTextColor(...COLOR_TEXT);
          doc.text(valueText, valueX, cursorY);
        }
        cursorY += rowHeight;
      });
      return cursorY - startY;
    };

    const drawHealthList = (
      doc: jsPDF,
      answers: Record<string, boolean> | null | undefined,
      x: number,
      startY: number,
      dryRun: boolean,
    ) => {
      const lineGap = 16;
      const labelMap = new Map(healthQuestionItems.map((item) => [item.key, item.label]));
      const entries = answers ? Object.entries(answers) : [];
      if (entries.length === 0) {
        if (!dryRun) {
          doc.setFontSize(10);
          doc.setTextColor(...COLOR_MUTED);
          doc.text("No health responses available.", x, startY);
        }
        return lineGap;
      }

      let cursorY = startY;
      entries.forEach(([key, value]) => {
        const label = labelMap.get(key) ?? key;
        if (!dryRun) {
          const dotColor = value ? COLOR_ACCENT : ([34, 197, 94] as [number, number, number]);
          doc.setFillColor(...dotColor);
          doc.circle(x, cursorY - 4, 2.5, "F");
          doc.setFontSize(10);
          doc.setTextColor(...COLOR_MUTED);
          doc.text(label, x + 9, cursorY);
          doc.setFontSize(11);
          doc.setTextColor(...COLOR_TEXT);
          doc.text(value ? "Yes" : "No", x + 180, cursorY);
        }
        cursorY += lineGap;
      });
      return cursorY - startY;
    };

    const drawImageContain = (
      doc: jsPDF,
      dataUrl: string,
      box: { x: number; y: number; w: number; h: number },
      imageType: "PNG" | "JPEG",
      dims: { renderW: number; renderH: number },
      dryRun: boolean,
    ) => {
      if (dryRun) return box.h;
      const { renderW, renderH } = dims;
      const offsetX = box.x + (box.w - renderW) / 2;
      const offsetY = box.y + (box.h - renderH) / 2;
      doc.setDrawColor(...COLOR_BORDER);
      doc.roundedRect(box.x, box.y, box.w, box.h, 6, 6);
      doc.addImage(dataUrl, imageType, offsetX, offsetY, renderW, renderH, undefined, "FAST");
      return box.h;
    };

    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 32;
      const gutter = 18;
      const columnWidth = (pageWidth - marginX * 2 - gutter) / 2;

      let selfiePrepared: { dataUrl: string; type: "PNG" | "JPEG"; renderW: number; renderH: number } | null = null;
      if (detailVisitor.selfieDisplayUrl) {
        try {
          const dataUrl = await fetchImageDataUrl(detailVisitor.selfieDisplayUrl as string);
          const { width, height } = await getImageDimensions(dataUrl);
          const boxW = columnWidth - 24;
          const boxH = 180;
          const scale = Math.min(boxW / width, boxH / height, 1);
          selfiePrepared = {
            dataUrl,
            type: (dataUrl.match(/^data:image\/(png|jpeg|jpg)/i)?.[1]?.toLowerCase() === "jpg"
              ? "JPEG"
              : "PNG") as "PNG" | "JPEG",
            renderW: width * scale,
            renderH: height * scale,
          };
        } catch {
          selfiePrepared = null;
        }
      }

      let currentY = 36;
      currentY = await drawHeader(doc, marginX, currentY, pageWidth);
      currentY += 16;

      // Row 1: Identity (left) + Visit (right)
      const identityBottom = drawSectionBox(
        doc,
        { title: "Identity", x: marginX, y: currentY, width: columnWidth },
        (startY, dryRun) =>
          drawKeyValueRows(
            doc,
            [
              ["Name", detailVisitor.name],
              ["Phone", detailVisitor.mobile || "N/A"],
              ["Company", detailVisitor.company || "Independent visitor"],
            ],
            marginX + 12,
            startY,
            columnWidth - 24,
            dryRun,
          ),
      );

      const visitBottom = drawSectionBox(
        doc,
        { title: "Visit", x: marginX + columnWidth + gutter, y: currentY, width: columnWidth },
        (startY, dryRun) => {
          const rows: Array<[string, string]> = [
            ["Host", detailVisitor.meetingWith || "N/A"],
            ["Purpose", detailVisitor.purpose || "Visit"],
            ["Date & time", `${detailVisitor.dateLabel} ${detailVisitor.time}`.trim()],
          ];
          if (detailVisitor.purposeNotes) {
            rows.push(["Notes", detailVisitor.purposeNotes]);
          }
          return drawKeyValueRows(
            doc,
            rows,
            marginX + columnWidth + gutter + 12,
            startY,
            columnWidth - 24,
            dryRun,
          );
        },
      );

      currentY = Math.max(identityBottom, visitBottom);

      // Row 2: Health (left) + Selfie (right)
      const healthBottom = drawSectionBox(
        doc,
        { title: "Health", x: marginX, y: currentY, width: columnWidth },
        (startY, dryRun) =>
          drawHealthList(
            doc,
            detailVisitor.healthAnswers ?? null,
            marginX + 12,
            startY,
            dryRun,
          ),
      );

      const selfieBottom = await drawSectionBox(
        doc,
        { title: "Selfie", x: marginX + columnWidth + gutter, y: currentY, width: columnWidth },
        (startY, dryRun) => {
          const box = {
            x: marginX + columnWidth + gutter + 12,
            y: startY,
            w: columnWidth - 24,
            h: 180,
          };
          if (!selfiePrepared) {
            if (!dryRun) {
              doc.setDrawColor(...COLOR_BORDER);
              doc.roundedRect(box.x, box.y, box.w, box.h, 6, 6);
              doc.setFontSize(10);
              doc.setTextColor(...COLOR_MUTED);
              doc.text("Selfie not provided.", box.x + 12, box.y + box.h / 2);
            }
            return box.h;
          }
          if (!dryRun) {
            try {
              drawImageContain(doc, selfiePrepared.dataUrl, box, selfiePrepared.type, {
                renderW: selfiePrepared.renderW,
                renderH: selfiePrepared.renderH,
              }, false);
            } catch (error) {
              console.error(error);
              doc.setFontSize(10);
              doc.setTextColor(...COLOR_MUTED);
              doc.text("Selfie preview unavailable.", box.x + 12, box.y + box.h / 2);
            }
          }
          return box.h;
        },
      );

      currentY = Math.max(healthBottom, selfieBottom);

      // Row 3: Site norms full width
      drawSectionBox(
        doc,
        { title: "Site Norms", x: marginX, y: currentY, width: pageWidth - marginX * 2 },
        (startY, dryRun) => {
          const baseX = marginX + 12;
          const lineGap = 18;
          const labelX = baseX + 9;
          const tickX = marginX + (pageWidth - marginX * 2) - 24;
          const maxTextWidth = tickX - labelX - 10;

          const fitSingleLine = (value: string) => {
            const ellipsis = "...";
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            if (doc.getTextWidth(value) <= maxTextWidth) return value;

            let trimmed = value;
            while (trimmed.length > 0 && doc.getTextWidth(trimmed + ellipsis) > maxTextWidth) {
              trimmed = trimmed.slice(0, -1);
            }
            return trimmed ? trimmed + ellipsis : value;
          };

          let cursorY = startY;

          SITE_NORMS_LINES.forEach((line) => {
            const text = fitSingleLine(line);

            if (!dryRun) {
              doc.setFont("helvetica", "normal");
              doc.setFontSize(10);
              doc.setTextColor(...COLOR_MUTED);
              doc.text(text, labelX, cursorY);

              doc.setFont("zapfdingbats", "normal");
              doc.setFontSize(12);
              doc.setTextColor(34, 197, 94);
              doc.text("4", tickX, cursorY);

              doc.setFont("helvetica", "normal");
              doc.setTextColor(...COLOR_TEXT);
            }

            cursorY += lineGap;
          });

          return cursorY - startY;
        },
      );

      doc.setFontSize(9);
      doc.setTextColor(...COLOR_MUTED);
      doc.text("Generated from Admin Dashboard", marginX, pageHeight - 32);

      const safeName = formatFilenamePart(detailVisitor.name || "visitor");
      const safeDate = formatFilenamePart(detailVisitor.date ?? new Date().toISOString());
      doc.save(`visitor-summary_${safeName}_${safeDate}.pdf`);
    } catch (error) {
      console.error(error);
      window.alert("Unable to export summary. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--bm-bg)] px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Admin data</p>
            <h1 className="text-3xl font-semibold text-[color:var(--bm-text)]">Visitor log</h1>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="rounded-[12px] border border-[color:var(--bm-primary)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]"
            >
              Filters
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 rounded-[20px] border border-[color:var(--bm-border)] bg-white/80 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--bm-text-muted)] shadow-sm">
          <Link
            href="/admin"
            className="rounded-full border border-[color:var(--bm-primary)] bg-white px-4 py-2 text-[0.65rem] text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/visitors"
            className="rounded-full border border-[color:var(--bm-accent)] px-4 py-2 text-[0.65rem] text-[color:var(--bm-accent)] transition hover:bg-[color:var(--bm-accent-soft)]"
          >
            Visitors
          </Link>
          <Link
            href="/visitor/checkin"
            className="rounded-full border border-[color:var(--bm-primary)] bg-white px-4 py-2 text-[0.65rem] text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)]"
          >
            New Check-in
          </Link>
        </div>

        <GlassPanel className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              label="Search by name or mobile"
              placeholder="Jordan Ellis / +1 555 012"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPageIndex(0);
              }}
              className="flex-1"
            />
            <div className="hidden flex-1 items-center gap-3 md:flex">
              <Select
                label="Purpose"
                options={[{ label: "All purposes", value: "all" }, ...purposeOptions.map((item) => ({ label: item, value: item }))]}
                value={purposeFilter}
                onChange={(event) => {
                  setPurposeFilter(event.target.value);
                  setPageIndex(0);
                }}
              />
              <Select
                label="Date range"
                options={timeframeFilters}
                value={timeframeFilter}
                onChange={(event) => {
                  setTimeframeFilter(event.target.value as "all" | "week" | "month");
                  setPageIndex(0);
                }}
              />
            </div>
          </div>

          {fetchError && (
            <div className="rounded-[16px] border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {fetchError}
            </div>
          )}

          <div className="space-y-4">
            {loading && (
              <p className="text-xs text-[color:var(--bm-text-muted)]">Loading visitor log...</p>
            )}
            <div className="hidden md:block">
              <VisitorTable
                data={pagedVisitors}
                onView={(visitor) => {
                  setDetailVisitor(visitor);
                  setDetailOpen(true);
                }}
              />
            </div>

            <div className="flex flex-col gap-4 md:hidden">
              {filteredVisitors.map((visitor) => (
                <motion.article
                  key={visitor.id}
                  className="rounded-[20px] border border-[color:var(--bm-border)] bg-white/80 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.1)]"
                  whileHover={{ y: -3 }}
                  onClick={() => {
                    setDetailVisitor(visitor);
                    setDetailOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[color:var(--bm-text)]">{visitor.name}</p>
                    <span className="rounded-full border border-[color:var(--bm-border)] bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-transparent shadow-[0_5px_12px_rgba(31,27,24,0.08)] select-none">
                      &nbsp;
                    </span>
                  </div>
                  <p className="text-xs text-[color:var(--bm-text-muted)]">{visitor.purpose}</p>
                  <p className="text-xs text-[color:var(--bm-text-muted)]">{visitor.mobile}</p>
                </motion.article>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">
            <span>
              Showing {Math.min(filteredVisitors.length, pageSize)} of {filteredVisitors.length} visitors
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                disabled={pageIndex === 0}
                className="rounded-[12px] border border-[color:var(--bm-primary)] bg-white px-3 py-1 text-xs font-semibold text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)] disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span>
                Page {pageIndex + 1} of {filteredPageCount}
              </span>
              <button
                type="button"
                onClick={() => setPageIndex((prev) => Math.min(prev + 1, filteredPageCount - 1))}
                disabled={pageIndex >= filteredPageCount - 1}
                className="rounded-[12px] border border-[color:var(--bm-primary)] bg-white px-3 py-1 text-xs font-semibold text-[color:var(--bm-primary)] transition hover:bg-[color:var(--bm-primary-soft)] disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </GlassPanel>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen} title="Filters" side="left" size="sm">
        <div className="space-y-4">
          <Input
            label="Search"
            placeholder="Name or mobile"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPageIndex(0);
            }}
          />
          <Select
            label="Purpose"
            options={[{ label: "All purposes", value: "all" }, ...purposeOptions.map((item) => ({ label: item, value: item }))]}
            value={purposeFilter}
            onChange={(event) => {
              setPurposeFilter(event.target.value);
              setPageIndex(0);
            }}
          />
          <Select
            label="Date range"
            options={timeframeFilters}
            value={timeframeFilter}
            onChange={(event) => {
              setTimeframeFilter(event.target.value as "all" | "week" | "month");
              setPageIndex(0);
            }}
          />
        </div>
      </Sheet>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen} title="Visitor details" size="lg">
        {detailVisitor && (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">{detailVisitor.meetingWith}</p>
              <h2 className="text-2xl font-semibold text-[color:var(--bm-text)]">{detailVisitor.name}</h2>
              <p className="text-sm text-[color:var(--bm-text-muted)]">
                {detailVisitor.company} · {detailVisitor.purpose}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Contact</p>
                <p className="text-sm text-[color:var(--bm-text-muted)]">{detailVisitor.mobile}</p>
                <p className="text-xs text-[color:var(--bm-text-muted)]">{detailVisitor.dateLabel}</p>
              </div>
              <div />
            </div>
            <div className="space-y-1 rounded-[20px] border border-dashed border-[color:var(--bm-border)] bg-[color:var(--bm-accent-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--bm-text-soft)]">Selfie preview</p>
              {detailVisitor.selfieDisplayUrl ? (
                <img
                  src={detailVisitor.selfieDisplayUrl}
                  alt={`${detailVisitor.name} selfie`}
                  width={360}
                  height={480}
                  className="h-40 w-full rounded-[16px] object-cover"
                  onLoad={handleSelfieLoad}
                  onError={handleSelfieError}
                />
              ) : (
              <div className="h-40 w-full rounded-[16px] bg-[color:var(--bm-primary-soft)]" />
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleExportSummary}
                className="rounded-[12px] bg-[color:var(--bm-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--bm-accent-hover)]"
              >
                Export summary
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}








