/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // HSTS already working
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          },
          // Prevent Clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          // Block MIME-sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          // Better privacy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          // Disable sensitive APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), usb=()"
          },
          // Start CSP in report-only mode to avoid breaking UI
          {
            key: "Content-Security-Policy-Report-Only",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data:;
              font-src 'self';
              connect-src 'self';
              frame-ancestors 'none';
            `.replace(/\s+/g, " ")
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;