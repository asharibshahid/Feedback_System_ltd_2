const ADMIN_EMAIL = "admin1@gmail.com";
const PASSWORD_1 = "ADMIN_PASS_1";
const PASSWORD_2 = "ADMIN_PASS_2";

const STORAGE_KEY = "adminAuth";
const MAX_SESSION_MS = 8 * 60 * 60 * 1000;

type AdminAuthRecord = {
  email: string;
  timestamp: number;
};

export function loginAdmin(email: string, password: string): { ok: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail !== ADMIN_EMAIL) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (password !== PASSWORD_1 && password !== PASSWORD_2) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (typeof window !== "undefined") {
    const record: AdminAuthRecord = {
      email: normalizedEmail,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  }

  return { ok: true };
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return false;
  }

  try {
    const record = JSON.parse(raw) as AdminAuthRecord;
    if (record.email !== ADMIN_EMAIL) {
      return false;
    }
    if (Number.isNaN(record.timestamp)) {
      return false;
    }
    const age = Date.now() - record.timestamp;
    if (age > MAX_SESSION_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return false;
  }
}

export function logoutAdmin(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export const adminAuthConfig = {
  ADMIN_EMAIL,
  PASSWORD_1,
  PASSWORD_2,
  MAX_SESSION_MS,
};
