import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Which implementation of the optional-feature module this build gets.
//
// `pro/` is a private git submodule, so on a clone without access to it the
// directory is either missing or present-but-empty — hence testing for the
// entry file rather than the directory. The choice is made here, once, at
// config time: there is no runtime branch and no environment variable, and a
// build without the submodule simply does not contain the code.
//
const proEntry = fileURLToPath(new URL("./pro/index.ts", import.meta.url));
const proModulePath = existsSync(proEntry) ? "./pro/index.ts" : "./pro-stub/index.ts";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      "@pro": proModulePath,
    },
  },
  // `.next/standalone` — a self-contained server with only the dependencies it
  // actually traced — is what the Dockerfile copies into the runtime image.
  // Opt-in rather than always on, so the Vercel deployment keeps building the
  // way it already does.
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "recharts",
    ],
  },
  // Compiler optimizations
  compiler: {
    // There was a configuration to remove console logging in prod
    // I personally think it's dumb ngl it makes it difficult to pin
    // down an error, you can uncomment it if you want
    // removeConsole: process.env.NODE_ENV === "production",
  },
  // Content-Security-Policy is not here: it carries a per-request nonce, so it is set
  // by the proxy instead (see lib/security-headers.ts). These are static, and being
  // here means they also cover the static assets the proxy does not run for.
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            // Two years, matching the preload list's minimum. Only add `preload` once
            // you are certain every subdomain will stay on HTTPS - it is hard to undo.
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            // Belt and braces with the CSP's `frame-ancestors 'none'`, for old browsers.
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // The app asks for none of these, so deny them outright.
            key: "Permissions-Policy",
            value:
              "accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
          },
          {
            // Isolates the session from anything this page opens or is opened by.
            // OAuth here is a full redirect, so popups are only used by dev tooling.
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
