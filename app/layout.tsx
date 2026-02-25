import type { Metadata } from "next";
import "./globals.css";
import { env } from "@/lib/env";

function hexToRgbValue(hex: string) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return "20 85 166";
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export const metadata: Metadata = {
  title: `${env.brandName} Portal`,
  description: "Wholesale ordering portal"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ ["--brand-color-rgb" as string]: hexToRgbValue(env.brandPrimaryColor) }}>{children}</body>
    </html>
  );
}
