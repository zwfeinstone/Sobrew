const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "BRAND_NAME",
  "BRAND_LOGO_URL",
  "BRAND_PRIMARY_COLOR"
] as const;

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`Missing environment variable: ${key}`);
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  orderInbox: process.env.ORDER_NOTIFICATION_EMAIL ?? "hello@sobrew.com",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  brandName: process.env.BRAND_NAME ?? "SoBrew Wholesale",
  brandLogoUrl: process.env.BRAND_LOGO_URL ?? "",
  brandPrimaryColor: process.env.BRAND_PRIMARY_COLOR ?? "#1455A6"
};
