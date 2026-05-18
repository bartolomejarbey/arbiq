import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer obsahuje nativní bindings a běží jen na serveru. Necháváme
  // ho jako externí package — Next.js ho nesnaží webpack-it do bundle.
  serverExternalPackages: ["@react-pdf/renderer"],

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
