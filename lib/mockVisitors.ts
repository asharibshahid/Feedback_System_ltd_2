import type { CanonicalStatus } from "@/lib/status";

export type VisitorStatus = CanonicalStatus;

export interface Visitor {
  id: string;
  name: string;
  mobile: string;
  company: string;
  purpose: string;
  meetingWith: string;
  status: VisitorStatus;
  date: string;
  dateLabel: string;
  time: string;
  selfieUrl?: string | null;
  selfieDisplayUrl?: string | null;
}

const names = [
  "Jordan Ellis",
  "Monica Rios",
  "Miles Ortega",
  "Serena Patel",
  "Liam Carter",
  "Priya Desai",
  "Haruto Yamamoto",
  "Camila Ortiz",
  "Nadia Brooks",
  "Oscar Meyer",
  "Clara Hastings",
  "Mateo Lobo",
  "Renee Park",
  "Gabe Lennon",
  "Dara Khalid",
  "Sonya Hsu",
  "Ibrahim Reed",
  "June Kim",
  "Leo Atkinson",
  "Tara Singh",
  "Nico Bishop",
  "Maya Carver",
  "Ethan Shaw",
  "Lena Ortiz",
  "Korey Adair",
  "Rosa Calderon",
  "Ivy Lambert",
  "Quinn Flores",
  "Holly Vega",
  "Cyrus Hyde",
];

const companies = [
  "Atlas Materials",
  "Northwind Logistics",
  "Helio River Tech",
  "Summit Partners",
  "Blue Harbor Group",
  "Evermark Supplies",
  "Apex Compliance",
  "Nova Works",
  "Crestline Builders",
  "Pulse Systems",
];

export const purposes = [
  "Meeting",
  "Delivery",
  "Audit Walk",
  "Site Inspection",
  "Interview",
  "Contractor",
];

export const purposeOptions = [...purposes];

const meetings = [
  "Avery Lane",
  "Marcella Green",
  "Dev Singh",
  "Azra Field",
  "Gregory Shaw",
  "Imani Rhodes",
  "Elena Park",
];

export const statuses: VisitorStatus[] = ["Approved", "Blocked", "Review", "Checked-in"];

const randomFrom = <T,>(items: T[]) =>
  items[Math.floor(Math.random() * items.length)];

const buildDate = (daysAgo: number, minuteOffset: number) => {
  const base = new Date();
  base.setDate(base.getDate() - daysAgo);
  base.setMinutes(base.getMinutes() - minuteOffset);
  return base;
};

export const visitors: Visitor[] = Array.from({ length: 30 }, (_, index) => {
  const dateObj = buildDate(index % 7, index * 7);
  const date = dateObj.toISOString();
  const dateLabel = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
  });
  const time = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    id: `visitor-${index + 1}`,
    name: names[index % names.length],
    mobile: `+1 555 01${(120 + index).toString().padStart(3, "0")}`,
    company: randomFrom(companies),
    purpose: randomFrom(purposes),
    meetingWith: randomFrom(meetings),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    date,
    dateLabel,
    time,
  };
});

export const getVisitorsByDay = (days = 7) => {
  const today = new Date();
  const result: Array<{ day: string; total: number; allowed: number; blocked: number }> =
    [];

  for (let delta = days - 1; delta >= 0; delta -= 1) {
    const target = new Date(today);
    target.setDate(today.getDate() - delta);
    const key = target.toISOString().split("T")[0];
    const dayLabel = target.toLocaleDateString("en-US", {
      weekday: "short",
    });
    const entries = visitors.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.toISOString().split("T")[0] === key;
    });
    const allowed = entries.filter((item) => item.status === "Approved").length;
    const blocked = entries.filter((item) => item.status === "Blocked").length;
    result.push({
      day: dayLabel,
      total: entries.length,
      allowed,
      blocked,
    });
  }

  return result;
};

export const getTodayStats = () => {
  const today = new Date().toISOString().split("T")[0];
  const todayVisitors = visitors.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate.toISOString().split("T")[0] === today;
  });

  const summary = {
    todayVisitors: todayVisitors.length,
    allowedEntries: visitors.filter((item) => item.status === "Approved").length,
    blockedEntries: visitors.filter((item) => item.status === "Blocked").length,
    review: visitors.filter((item) => item.status === "Review").length,
    checkedIn: visitors.filter((item) => item.status === "Checked-in").length,
  };

  return summary;
};
