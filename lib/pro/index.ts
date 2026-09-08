import proModule from "@pro";
import { NO_CAPABILITIES, type ProCapabilities, type ProModule } from "./contract";

export type { Capability, CapabilityCta, ProCapabilities, ProModule, ProRequestHandler } from "./contract";
export { NO_CAPABILITIES } from "./contract";

/**
 * The handler for one optional route, or nothing.
 *
 * A route shell calls this and answers 404 when it comes back undefined, which
 * is what every route below `app/api/pro/` does in a build without the module.
 */
export function proHandler(name: string): ((request: Request) => Promise<Response>) | undefined {
  return proModule.handlers?.[name];
}

/**
 * Whether the optional module is compiled into this build at all.
 *
 * Route shells use this to decide between serving and `notFound()`. Feature
 * code should prefer the individual capability — "can I show this" is almost
 * always the question, and it stays the same question in every edition.
 */
export const proPresent = proModule.present;

/**
 * The failure rule, separated from the module it normally asks so that it can
 * be tested against a module that misbehaves. Not for general use — call
 * `capabilities` instead.
 *
 * Never throws. A capability lookup failing — the module's database is
 * unreachable, say — must degrade to "you cannot use this right now" rather
 * than take down the page the feature is a corner of. Degrading *closed* is the
 * only safe direction: the alternative is an outage handing out paid features.
 * The user sees the feature quietly absent, which is exactly what a self-hosted
 * install sees permanently, so there is no separate broken state to design for.
 */
export async function capabilitiesFrom(
  module: Pick<ProModule, "capabilitiesFor">,
  userId: string,
): Promise<ProCapabilities> {
  try {
    return await module.capabilitiesFor(userId);
  } catch (error) {
    console.error("Capability lookup failed; treating every optional feature as unavailable:", error);
    return NO_CAPABILITIES;
  }
}

/**
 * What this user can do, in this build.
 *
 * Resolves through the `@pro` alias, which `next.config.mjs` points at either
 * the private module or `pro-stub/`. Callers cannot tell which they got, and
 * that is the point: there is one code path, and it is the one that works when
 * the module is absent.
 */
export function capabilities(userId: string): Promise<ProCapabilities> {
  return capabilitiesFrom(proModule, userId);
}
