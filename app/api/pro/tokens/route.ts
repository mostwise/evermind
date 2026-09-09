import { proRoute } from "@/lib/pro/shell";

/**
 * A shell — see `../checkout/route.ts`.
 *
 * Managing the keys to the versioned API, from the settings page. Session
 * cookie, same origin, exactly like the rest of the app: a token cannot be the
 * credential that issues tokens, or losing one would be unrecoverable in the
 * direction that matters.
 *
 * `DELETE` takes the token's id as a query parameter rather than a path
 * segment, so that all three verbs fit one shell instead of two.
 */

export const dynamic = "force-dynamic";

export const GET = proRoute("tokens-list");
export const POST = proRoute("tokens-create");
export const DELETE = proRoute("tokens-revoke");
