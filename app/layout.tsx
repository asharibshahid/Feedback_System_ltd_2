import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/layout/AppHeader";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const headingFont = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Command Center",
  description: "Premium command center dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${headingFont.variable} antialiased min-h-screen overflow-x-hidden bg-[color:var(--bm-bg)] text-[color:var(--bm-text)]`}
      >
        <AppHeader />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
