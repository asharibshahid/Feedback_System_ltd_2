import type { Metadata } from "next";
import type { ReactNode } from "react";
import { VisitorFlowProvider } from "@/components/visitor/VisitorFlowProvider";

export const metadata: Metadata = {
  title: "Visitor Check-In",
  description: "Fast visitor registration with health screening and selfie capture.",
};

export default function VisitorLayout({ children }: { children: ReactNode }) {
  return <VisitorFlowProvider>{children}</VisitorFlowProvider>;
}
