import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  // Force HTTPS — preload chce 2-year cache (63072000 s), includeSubDomains.
  // PRO PRODUKCI: po prvním pushi přihlas doménu na https://hstspreload.org
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Žádný iframe — clickjacking defense.
  { key: "X-Frame-Options", value: "DENY" },
  // MIME sniffing block.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer info jen na stejný origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable senzorové/feature APIs co nepoužíváme.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), gyroscope=(self), accelerometer=(self)",
  },
  // Cross-origin opener — izoluje window opener pro lepší isolation.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // @react-pdf/renderer obsahuje nativní bindings a běží jen na serveru. Necháváme
  // ho jako externí package — Next.js ho nesnaží webpack-it do bundle.
  serverExternalPackages: ["@react-pdf/renderer"],

  // Image optimization — AVIF + WebP, sensible device sizes pro Czech UX.
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Supabase Storage signed URLs (pro projekty s public bucket nebo
      // pro klientské avatary).
      { protocol: "https", hostname: "wwygmqcleluoioafjskt.supabase.co" },
    ],
  },

  // Bezpečnostní HTTP hlavičky pro všechny routes (mimo statika, kde se
  // CSP konfiguruje na úrovni response v middleware/proxy).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },

  // Vercel serverless functions defaultně nebundlují public/. Pro PDF
  // generátory (@react-pdf/renderer s lokálními TTF + logem) musíme tyhle
  // assety explicitně přidat do output bundle.
  outputFileTracingIncludes: {
    "/portal/admin/smlouvy/**": ["./public/fonts/**", "./public/arbiq-logo.png"],
    "/portal/admin/faktury/**": ["./public/fonts/**", "./public/arbiq-logo.png"],
    "/api/portal/contracts/**": ["./public/fonts/**", "./public/arbiq-logo.png"],
    "/api/portal/invoices/**": ["./public/fonts/**", "./public/arbiq-logo.png"],
  },
};

export default nextConfig;
