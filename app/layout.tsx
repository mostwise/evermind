import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import type React from "react";
import { Suspense } from "react";
import { ColorThemeProvider, colorThemeScript } from "@/components/color-theme-provider";
import { CompactModeProvider, compactModeScript } from "@/components/compact-mode-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// `variable`, not `className`: the families are consumed through `--font-sans` /
// `--font-mono` in globals.css, and next/font mangles the real family name into
// something like `__Geist_1a2b3c`. Naming them "Geist" in the stylesheet — which
// is what this file used to rely on — matched nothing, so both fonts were
// downloaded on every page load and then never used.
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  // Absolute URLs for the OG and Twitter cards are resolved against this. Set
  // NEXT_PUBLIC_SITE_URL in production; localhost is only ever right in dev.
  metadataBase: new URL(siteUrl),
  title: "Evermind - Assignment Tracker",
  description: "Never miss a deadline again. Track your assignments and stay on top of your coursework.",
  applicationName: "Evermind",
  openGraph: {
    type: "website",
    siteName: "Evermind",
    title: "Evermind - Assignment Tracker",
    description: "Never miss a deadline again. Track your assignments and stay on top of your coursework.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Evermind - Assignment Tracker",
    description: "Never miss a deadline again. Track your assignments and stay on top of your coursework.",
  },
  // No `icons` block. `app/icon.svg` and `app/apple-icon.tsx` are picked up by
  // the file conventions, which is also what stops this drifting: the previous
  // block named four files, none of which existed, so every page load fetched
  // four 404s (audit M4).
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Set by the proxy, and the same value the Content-Security-Policy on this response
  // names. Reading it is what makes every route render per request.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* These run before paint to stop a flash of the wrong theme. Both strings are
            built in this repo from a fixed set of theme ids - no user input reaches them. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted, locally-authored FOUC script */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: compactModeScript }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted, locally-authored FOUC script */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: colorThemeScript }} />
      </head>
      <body className={`font-sans antialiased`}>
        {/* next-themes emits its own pre-paint script; without the nonce the CSP drops it. */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem nonce={nonce}>
          <CompactModeProvider>
            <ColorThemeProvider>
              {children}
              <Suspense fallback={null}>
                <Toaster />
              </Suspense>
            </ColorThemeProvider>
          </CompactModeProvider>
        </ThemeProvider>
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
