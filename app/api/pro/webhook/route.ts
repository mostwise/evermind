import { proRoute } from "@/lib/pro/shell";

/**
 * A shell, like its sibling — see `../checkout/route.ts`.
 *
 * `runtime = "nodejs"` is load-bearing rather than a default worth leaving
 * implicit: the handler verifies an HMAC with `node:crypto`, which the Edge
 * runtime does not provide.
 *
 * This route is also excluded from the proxy's matcher in `proxy.ts`. Without
 * that, every delivery pays for a Supabase `auth.getUser()` round trip before
 * reaching a handler that has no session and does not want one — on a request
 * whose caller gives up after about ten seconds.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = proRoute("webhook");
