import { beforeAll, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { z } from "zod";
import { ApiError, json, jsonBody, problem } from "@/lib/api/http";
import { validate } from "@/lib/api/validate";

/**
 * The `/api` layer, tested at the seams it actually has.
 *
 * `withUser` reaches for a Supabase session, which needs a request context this
 * test has no way to build, so the server client is replaced below and the
 * assertions are about the *order and shape* of what the wrapper does: which
 * guard runs first, what a handler's throw becomes, and what never reaches the
 * user. That ordering is the point of the wrapper — an origin check that runs
 * after a database round trip has not saved the round trip.
 */

/** Swapped per test to steer the fake `auth.getUser()`. */
let session: { user: { id: string } | null; error: unknown } = { user: { id: "user-1" }, error: null };

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: session.user }, error: session.error }),
    },
  }),
}));

/**
 * Imported lazily rather than at the top of the file, for two reasons: the mock
 * above has to be registered before the module under test reads it, and
 * `tsconfig.json` targets ES6, where a top-level `await` is a type error.
 */
let withUser: typeof import("@/lib/api/with-user").withUser;

beforeAll(async () => {
  ({ withUser } = await import("@/lib/api/with-user"));
});

/** A same-origin POST, which is what the app's own fetches look like. */
function appRequest(url = "https://evermind.test/api/thing", init: RequestInit = {}): Request {
  return new Request(url, {
    method: "POST",
    ...init,
    headers: { "sec-fetch-site": "same-origin", "x-forwarded-for": "203.0.113.9", ...(init.headers ?? {}) },
  });
}

/** Unique per test, because the rate limiter's windows are module-level state. */
let counter = 0;
function uniqueName(): string {
  counter += 1;
  return `test-route-${counter}-${Math.random().toString(36).slice(2)}`;
}

beforeEach(() => {
  session = { user: { id: "user-1" }, error: null };
});

describe("problem and json", () => {
  test("a problem is only ever `{ error }`", async () => {
    const response = problem(404, "No such assignment.");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "No such assignment." });
  });

  test("json passes the payload through untouched", async () => {
    const response = json({ id: "a1", title: "Essay" }, { status: 201 });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "a1", title: "Essay" });
  });
});

describe("jsonBody", () => {
  test("returns the parsed body", async () => {
    expect(await jsonBody(appRequest("https://evermind.test/x", { body: '{"a":1}' }))).toEqual({ a: 1 });
  });

  test("a malformed body is the caller's fault, not a 500", async () => {
    const request = appRequest("https://evermind.test/x", { body: "{ not json" });

    // The distinction that matters: this must be an ApiError carrying 400, not
    // a raw SyntaxError, or the catch-all in withUser reports a server fault
    // for a client mistake.
    expect(jsonBody(request)).rejects.toThrow(ApiError);
    await jsonBody(request).catch((error: ApiError) => expect(error.status).toBe(400));
  });
});

describe("validate", () => {
  const schema = z.object({ title: z.string().min(1), due_date: z.string() });

  test("returns the parsed value", () => {
    expect(validate(schema, { title: "Essay", due_date: "2026-09-09" })).toEqual({
      title: "Essay",
      due_date: "2026-09-09",
    });
  });

  test("names the field that was wrong, because the message is shown to a person", () => {
    try {
      validate(schema, { title: "", due_date: "2026-09-09" });
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).message).toStartWith("title: ");
    }
  });

  test("reports one issue rather than a list", () => {
    try {
      validate(schema, {});
      throw new Error("should have thrown");
    } catch (error) {
      expect((error as ApiError).message.split("\n")).toHaveLength(1);
    }
  });
});

describe("withUser", () => {
  test("serves the handler for a signed-in, same-origin request", async () => {
    const route = withUser({ name: uniqueName() }, async (_request, { user }) => json({ seenAs: user.id }));

    const response = await route(appRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ seenAs: "user-1" });
  });

  test("rejects a cross-site request before touching the session", async () => {
    let handlerRan = false;
    const route = withUser({ name: uniqueName() }, async () => {
      handlerRan = true;
      return json({});
    });

    const response = await route(
      new Request("https://evermind.test/api/thing", {
        method: "POST",
        headers: { "sec-fetch-site": "cross-site" },
      }),
    );

    expect(response.status).toBe(403);
    expect(handlerRan).toBe(false);
  });

  test("rejects a request carrying neither Origin nor Sec-Fetch-Site", async () => {
    const route = withUser({ name: uniqueName() }, async () => json({}));

    const response = await route(new Request("https://evermind.test/api/thing", { method: "POST" }));

    expect(response.status).toBe(403);
  });

  test("answers 401 when there is no session", async () => {
    session = { user: null, error: null };
    const route = withUser({ name: uniqueName() }, async () => json({ reached: true }));

    const response = await route(appRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "You are not signed in." });
  });

  test("an ApiError from the handler becomes its own status and message", async () => {
    const route = withUser({ name: uniqueName() }, async () => {
      throw new ApiError(404, "No such assignment.");
    });

    const response = await route(appRequest());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "No such assignment." });
  });

  test("an unexpected throw is logged but never echoed to the user", async () => {
    const logged = spyOn(console, "error").mockImplementation(() => {});
    const route = withUser({ name: uniqueName() }, async () => {
      throw new Error('column "secret_internal_column" does not exist');
    });

    try {
      const response = await route(appRequest());
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(JSON.stringify(body)).not.toInclude("secret_internal_column");
      expect(logged).toHaveBeenCalled();
    } finally {
      logged.mockRestore();
    }
  });

  test("throttles per user, and says so with a Retry-After", async () => {
    const name = uniqueName();
    const route = withUser({ name, perUser: { limit: 2, windowMs: 60_000 } }, async () => json({ ok: true }));

    expect((await route(appRequest())).status).toBe(200);
    expect((await route(appRequest())).status).toBe(200);

    const blocked = await route(appRequest());

    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  test("the per-address limit runs before the session lookup", async () => {
    const name = uniqueName();
    let sessionLookups = 0;
    session = {
      get user() {
        sessionLookups += 1;
        return { id: "user-1" };
      },
      error: null,
    } as typeof session;

    const route = withUser({ name, perAddress: { limit: 1, windowMs: 60_000 } }, async () => json({ ok: true }));

    await route(appRequest());
    const blocked = await route(appRequest());

    expect(blocked.status).toBe(429);
    // The second request must not have cost a Supabase round trip.
    expect(sessionLookups).toBe(1);
  });

  test("one user's budget is not another's", async () => {
    const name = uniqueName();
    const route = withUser({ name, perUser: { limit: 1, windowMs: 60_000 } }, async () => json({ ok: true }));

    await route(appRequest());
    expect((await route(appRequest())).status).toBe(429);

    session = { user: { id: "user-2" }, error: null };
    expect((await route(appRequest())).status).toBe(200);
  });
});
