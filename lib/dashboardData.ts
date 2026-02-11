import type { LucideIcon } from "lucide-react";
import {
  Cloud,
  LayoutDashboard,
  Radio,
  Signal,
  Settings,
  Sparkles,
} from "lucide-react";

export type FeedItem = {
  id?: string | null;
  name: string;
  status: "pending" | "complete";
  purpose: string;
  time: string;
};

export type IconRailItem = {
  label: string;
  icon: LucideIcon;
};

export const liveFeed: FeedItem[] = [
  { id: null, name: "Jordan Ellis", status: "complete", purpose: "Audit Walk", time: "09:12 AM" },
  { id: null, name: "Monica Rios", status: "pending", purpose: "Delivery", time: "09:07 AM" },
  { id: null, name: "Miles Ortega", status: "pending", purpose: "Contractor", time: "08:59 AM" },
  { id: null, name: "Serena Patel", status: "complete", purpose: "Inspection", time: "08:43 AM" },
  { id: null, name: "Liam Carter", status: "complete", purpose: "Meeting", time: "08:27 AM" },
  { id: null, name: "Priya Desai", status: "complete", purpose: "Maintenance", time: "08:11 AM" },
  { id: null, name: "Nadia Brooks", status: "pending", purpose: "Interview", time: "07:58 AM" },
  { id: null, name: "Owen Reed", status: "pending", purpose: "Vendor", time: "07:45 AM" },
];

export const railIcons: IconRailItem[] = [
  { label: "Pulse", icon: LayoutDashboard },
  { label: "Signal", icon: Signal },
  { label: "Beacon", icon: Sparkles },
  { label: "Radiant", icon: Radio },
  { label: "Cloud", icon: Cloud },
  { label: "Control", icon: Settings },
];
