import { getBranding } from "@/lib/data";
import { requireCustomer } from "@/lib/auth";

function hexToRgbValue(hex: string | null) {
  if (!hex) return "20 85 166";
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return "20 85 166";
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export default async function CenterLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCustomer();
  const branding = await getBranding(profile.center_id ?? undefined);

  return (
    <div style={{ ["--brand-color-rgb" as string]: hexToRgbValue(branding.accent_color) }}>{children}</div>
  );
}
