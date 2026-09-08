import type { ZodType, z } from "zod";
import { ApiError } from "./http";

/**
 * Parses a value against a schema, or fails the request with a message worth reading.
 *
 * Zod's own messages are written for developers ("Expected string, received
 * number"), and this envelope's `error` goes straight onto the user's screen.
 * So the issue is rendered as "<field>: <message>" and the field is the path,
 * which is the part a person can act on. Only the first issue is reported —
 * a list of six complaints about one form is worse than the first one.
 */
export function validate<T extends ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  const [issue] = result.error.issues;
  const field = issue.path.join(".");

  throw new ApiError(400, field ? `${field}: ${issue.message}` : issue.message);
}
