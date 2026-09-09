import { notFound } from "next/navigation";
import { proSection } from "@/lib/pro";

/**
 * A shell, like the route shells under `app/api/pro/` — the body of this page
 * is not in this repository.
 *
 * Every "there is more available" prompt in the app links here, and every one
 * of them comes from the optional module, which supplies its own wording (see
 * `lib/pro/contract.ts`). In a build without that module nothing links here and
 * nothing is here: `proSection` returns undefined and this is a 404, exactly
 * like a page that was never written.
 *
 * That is why this file describes nothing. A self-hosted instance has no
 * edition to sell, so a page here listing features and a price would be
 * advertising something its operator does not offer.
 */

/**
 * Note what is *not* here: `export const dynamic = "force-dynamic"`.
 *
 * With it, this route is rendered per request and streaming starts before
 * `notFound()` is reached — so a build without the module answered the 404 page
 * with a **200 status**, which is worse than either honest answer. Without it,
 * a build with no module resolves this at build time and serves a real static
 * 404, and a build with one renders dynamically anyway, because the section it
 * returns reads the session cookie.
 */
export default function ProPage() {
  const Section = proSection("pro-page");

  if (!Section) {
    notFound();
  }

  return <Section />;
}
