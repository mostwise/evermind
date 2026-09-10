import { proRoute } from "@/lib/pro/shell";

/**
 * A shell — see `../checkout/route.ts`.
 *
 * How long this account keeps completed assignments. The clean-up that reads
 * the answer is in `lib/data/retention.ts` and runs in every build; only
 * *changing* the answer comes from the optional module, which is why the table
 * it writes is a public one with no write policy on it and this route is the
 * only thing in the application that can touch it.
 *
 * `GET` reports the current setting and whether this account may change it.
 * That second flag is for drawing the form, not for guarding it — flipping it
 * in the browser gets you a `PUT` that is refused, which is the same posture as
 * `../tokens/route.ts`.
 */

export const dynamic = "force-dynamic";

export const GET = proRoute("retention-read");
export const PUT = proRoute("retention-write");
