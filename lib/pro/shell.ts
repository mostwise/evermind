import { NextResponse } from "next/server";
import { proHandler } from "./index";

/**
 * The body of a route that is not in this repository.
 *
 * Next.js needs a file under `app/` for every route, so the optional module
 * cannot supply one on its own — it supplies the handler, and a shell here
 * finds it by name. There are four such shells now, and they were four copies
 * of the same six lines, so the shape lives in one place.
 *
 * **404, not 403, and not 501.** A build without the module does not have a
 * disabled version of these routes; it does not have them. Answering anything
 * else would describe a feature the caller cannot reach, which is exactly the
 * "free tier with the paid parts greyed out" that the whole boundary is built
 * to avoid — and it would tell a scanner which paths are worth a second look.
 *
 * The shells are the one place a reader of the public repository can learn that
 * a commercial edition exists, and all they learn is a directory name.
 */
export function proRoute(name: string): (request: Request) => Promise<Response> {
  return async function route(request: Request): Promise<Response> {
    const handler = proHandler(name);

    if (!handler) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return handler(request);
  };
}
