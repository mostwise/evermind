import { NextResponse } from "next/server";

/**
 * The shape every `/api` route answers in.
 *
 * Success is the payload itself; failure is `{ error }` and nothing else. That
 * asymmetry is deliberate and predates this module: `delete-account-dialog.tsx`
 * and `export-data-button.tsx` already read `body.error` and render it verbatim
 * to the user. Keeping the envelope means those two keep working, and it means
 * every message written here is a message a person will actually read — so
 * write them as sentences, not as error codes.
 */

/** A failure that should become a response rather than a stack trace. */
export class ApiError extends Error {
  readonly status: number;

  /**
   * @param status HTTP status to answer with.
   * @param message shown to the user verbatim. Say what happened and what they can do.
   */
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function problem(status: number, message: string, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ error: message }, { status, headers });
}

/**
 * The body of a request that is supposed to have one.
 *
 * A malformed body is the client's fault, not a 500 — but `request.json()`
 * throws the same way a bug does, so it is caught here and relabelled before it
 * can reach the catch-all in `withUser` and be reported as a server error.
 */
export async function jsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "That request was not valid JSON.");
  }
}
