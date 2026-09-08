import type { MetadataRoute } from "next";

/**
 * The web app manifest.
 *
 * Added here with the icons because it is the other thing that wants them; the
 * offline half of installability — a service worker and a mutation queue — is a
 * separate piece of work and is not here yet.
 *
 * The icon list is deliberately just the SVG and the touch icon. Chrome accepts
 * an SVG with `sizes: "any"` for installability, so this is enough to install;
 * a full raster set at 192 and 512 belongs with the service worker rather than
 * ahead of it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Evermind — Assignment Tracker",
    short_name: "Evermind",
    description: "Never miss a deadline again. Track your assignments and stay on top of your coursework.",
    // Not "/": the proxy redirects that to /dashboard or /preview depending on
    // whether there is a session, and a launch that begins with a redirect
    // shows the splash for longer than it needs to.
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f9f9",
    theme_color: "#0d9488",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
