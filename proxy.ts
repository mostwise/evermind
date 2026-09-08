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
  // `api/pro/webhook` is excluded deliberately, and it is the only route that is.
  //
  // `updateSession` calls `auth.getUser()` unconditionally, before any path
  // branching — a Supabase round trip on every request that reaches here. That
  // route is a machine-to-machine callback: it has no session and wants none,
  // it is not called by a browser, and its caller abandons the request after
  // about ten seconds. An auth lookup on every delivery buys nothing and risks
  // the timeout.
  //
  // In a build without the optional module the route is a 404 either way, so
  // this exclusion is harmless there rather than conditional.
  //
  // It costs the CSP header, which a machine-to-machine POST has no use for.
  matcher: ["/((?!api/pro/webhook|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
