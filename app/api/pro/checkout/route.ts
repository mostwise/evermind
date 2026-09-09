import { proRoute } from "@/lib/pro/shell";

/**
 * A shell. The body of this route is not in this repository.
 *
 * Next.js needs a file under `app/` for every route, so the optional module
 * cannot supply one on its own — it supplies the handler, and `proRoute` finds
 * it by name. In a build without that module there is no handler, and the route
 * is a 404 in every sense that matters: nothing to call, and nothing here that
 * says what it would have done.
 */

export const dynamic = "force-dynamic";

export const POST = proRoute("checkout");
