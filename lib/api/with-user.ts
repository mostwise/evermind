import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";
import { isSameOriginRequest } from "@/lib/security/origin";
import { clientAddress, rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { ApiError, problem } from "./http";

/**
 * The four things every `/api` route does before it does its own job.
 *
 * Origin, rate limit, session, then the handler — in that order, because each
 * step costs more than the last and there is no reason to pay for one until the
 * cheaper ones have passed. `auth.getUser()` in particular is a network call to
 * Supabase, so the per-address limit deliberately sits *in front* of it.
 *
 * **The client this hands you is the anon one, holding the user's own cookie.**
 * That is the whole security posture and it is not an oversight: Postgres still
 * applies row-level security to everything the handler does, exactly as it does
 * for the browser talking to PostgREST directly. This layer adds validation and
 * throttling in front of that boundary; it does not become the boundary. A
 * handler that reaches for `createAdminClient()` has stepped outside RLS and
 * owes the reader a comment saying why.
 */

export interface UserContext<P = unknown> {
  readonly user: User;
  /** Anon client carrying this user's session. RLS applies to every query made with it. */
  readonly supabase: SupabaseClient<Database>;
  /**
   * The dynamic segments of the route, already awaited — Next hands these over
   * as a promise, and a handler that forgets to await it gets a `Promise`
   * where it expected a string and a 404 it cannot explain.
   */
  readonly params: P;
}

export interface Limit {
  readonly limit: number;
  readonly windowMs: number;
}

export interface WithUserOptions {
  /**
   * Prefix for the rate-limit keys. Give each route its own, or two routes
   * share one budget and a busy read starves a write.
   */
  readonly name: string;
  /** Coarse guard on the work done before the session is known. */
  readonly perAddress?: Limit;
  /** The real limit, keyed by user so one person on a shared network cannot starve the rest. */
  readonly perUser?: Limit;
}

/**
 * Generous, because these are ordinary reads and writes from a page the user is
 * looking at, and a limit that trips during normal use is worse than no limit.
 * The job is stopping a runaway client loop, not rationing.
 */
const DEFAULT_PER_ADDRESS: Limit = { limit: 240, windowMs: 60 * 1000 };
const DEFAULT_PER_USER: Limit = { limit: 120, windowMs: 60 * 1000 };

export type UserHandler<P = unknown> = (request: Request, context: UserContext<P>) => Promise<NextResponse>;

/** What Next passes as the second argument to a dynamic route's handler. */
export interface RouteContext<P> {
  params: Promise<P>;
}

export function withUser<P = unknown>(options: WithUserOptions, handler: UserHandler<P>) {
  const perAddress = options.perAddress ?? DEFAULT_PER_ADDRESS;
  const perUser = options.perUser ?? DEFAULT_PER_USER;

  return async function route(request: Request, routeContext?: RouteContext<P>): Promise<NextResponse> {
    // Costs nothing and needs no session, so it goes first.
    if (!isSameOriginRequest(request)) {
      return problem(403, "This request did not come from Evermind.");
    }

    const byAddress = rateLimit(
      `${options.name}:addr:${clientAddress(request)}`,
      perAddress.limit,
      perAddress.windowMs,
    );
    if (!byAddress.allowed) {
      return tooManyRequests(byAddress, "Too many requests. Please wait a moment and try again.");
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return problem(401, "You are not signed in.");
    }

    const byUser = rateLimit(`${options.name}:user:${data.user.id}`, perUser.limit, perUser.windowMs);
    if (!byUser.allowed) {
      return tooManyRequests(byUser, "Too many requests. Please wait a moment and try again.");
    }

    try {
      const params = (routeContext ? await routeContext.params : undefined) as P;
      return await handler(request, { user: data.user, supabase, params });
    } catch (thrown) {
      if (thrown instanceof ApiError) {
        return problem(thrown.status, thrown.message);
      }

      // Anything else is a bug. The user gets a sentence; the detail goes to the
      // server log, because it is exactly the kind of thing that leaks a column
      // name or a connection string if it is echoed back.
      console.error(`Unhandled error in ${options.name}:`, thrown);
      return problem(500, "Something went wrong on our end. Please try again.");
    }
  };
}
