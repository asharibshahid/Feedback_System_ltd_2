export type CanonicalStatus = "Approved" | "Blocked" | "Review" | "Checked-in";

type StatusAliasMap = Record<CanonicalStatus, string[]>;

export const STATUS_ALIASES: StatusAliasMap = {
  Approved: ["approved", "allow", "allowed", "approved-in"],
  Blocked: ["blocked", "denied", "rejected"],
  Review: ["review", "pending", "needs review", "awaiting", "queued"],
  "Checked-in": ["checked-in", "checked in", "arrived", "arrival", "present"],
};

export const STATUS_BADGE_VARIANT: Record<CanonicalStatus, "success" | "danger" | "warning" | "neutral"> = {
  Approved: "success",
  Blocked: "danger",
  Review: "warning",
  "Checked-in": "neutral",
};

export const toDbStatus = (status: CanonicalStatus): string => {
  if (status === "Checked-in") return "checked-in";
  return status.toLowerCase();
};

export const normalizeStatus = (value: string | null | undefined): CanonicalStatus => {
  const raw = (value ?? "").trim().toLowerCase();
  for (const [status, aliases] of Object.entries(STATUS_ALIASES)) {
    if (aliases.some((alias) => raw === alias)) {
      return status as CanonicalStatus;
    }
  }
  return "Review";
};

export const buildStatusOrFilter = (status: CanonicalStatus): string | null => {
  const aliases = STATUS_ALIASES[status];
  if (!aliases || aliases.length === 0) return null;
  return aliases.map((alias) => `status.ilike.${alias}`).join(",");
};

export const displayStatusLabel = () => "Complete";
