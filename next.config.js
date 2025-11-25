// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // HSTS
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          },
          // Prevent MIME sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          // Safer referrer behavior
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          // Permissions Policy (lock down hardware APIs)
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), usb=(), payment=()"
          },
          // CSP in report-only mode (start here to avoid breaking things)
          {
            key: "Content-Security-Policy-Report-Only",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data:;
              font-src 'self';
              connect-src 'self' https:;
              frame-ancestors 'none';
            `.replace(/\s+/g, " ")
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
