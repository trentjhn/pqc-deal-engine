import type { NextConfig } from "next";

/**
 * Standard security headers.
 *
 * The app serves no user-generated HTML and renders all dynamic content through
 * React (auto-escaped); there is no dangerouslySetInnerHTML anywhere, so the XSS
 * surface is minimal. The CSP locks resource loading to same-origin. 'unsafe-inline'
 * is required for Next's inline bootstrap + Tailwind styles; 'unsafe-eval' and the
 * dev websocket are allowed only in development (Turbopack HMR needs them) so the
 * production policy stays tight.
 */
const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self'${isProd ? "" : " ws: http://localhost:*"}`,
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
