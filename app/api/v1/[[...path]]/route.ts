import { proRoute } from "@/lib/pro/shell";

/**
 * The versioned HTTP API, or a 404.
 *
 * One optional catch-all rather than a file per resource, because the routing
 * table belongs with the handlers: a build without the optional module has no
 * resources to route to, and a public repository listing `assignments/` and
 * `classes/` here would be publishing the shape of something it does not
 * implement.
 *
 * `[[...path]]` and not `[...path]` so that `/api/v1` itself resolves, which
 * gives the module somewhere to answer "what is this and where are the docs".
 *
 * There is deliberately no `OPTIONS`. Nothing here sends CORS headers, so a
 * browser on another origin cannot call this API — it is for servers, scripts
 * and shortcuts, which do not preflight.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = proRoute("v1");
export const POST = proRoute("v1");
export const PATCH = proRoute("v1");
export const DELETE = proRoute("v1");
