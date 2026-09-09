import type { NextRequest } from "next/server";
import { contentSecurityPolicy, generateNonce } from "@/lib/security-headers";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const nonce = generateNonce();
  const csp = contentSecurityPolicy(nonce);

  // Both go on the *request*: Next.js reads the policy to nonce the scripts it emits,
  // and the root layout reads `x-nonce` to nonce the two theme scripts it emits.
  const response = await updateSession(request, {
    "x-nonce": nonce,
    "content-security-policy": csp,
  });

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Two routes are excluded deliberately, for the same reason.
  //
  // `updateSession` calls `auth.getUser()` unconditionally, before any path
  // branching — a Supabase round trip on every request that reaches here.
  // Neither of these routes has a session cookie to refresh, so that round trip
  // is pure latency on a path where latency is the whole complaint:
  //
  //   api/pro/webhook  a machine-to-machine callback whose caller abandons the
  //                    request after about ten seconds
  //   api/v1           authenticated by a bearer token, called by scripts in a
  //                    loop rather than by a browser once a page
  //
  // In a build without the optional module both are 404s either way, so these
  // exclusions are harmless there rather than conditional.
  //
  // It costs the CSP header, which neither a callback nor a JSON API has any
  // use for — nothing renders their responses.
  matcher: ["/((?!api/pro/webhook|api/v1|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
