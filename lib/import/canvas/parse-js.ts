import { collectCourseData } from "./course-data";
import { AssignmentCollector } from "./normalise";
import { fail, ok, type ParseResult } from "./types";

const MARKER = "COURSE_DATA";

/**
 * Reads Canvas's `course-data.js`, which is a single
 * `window.COURSE_DATA = { … }` assignment.
 *
 * The object is located by scanning for balanced braces rather than by regular
 * expression. The previous `/window\.COURSE_DATA\s*=\s*(\{[\s\S]*\})/` was
 * greedy: `[\s\S]*` runs to the **last** `}` in the file, so anything after the
 * object — a second statement, a sourcemap comment, a trailing newline inside a
 * wrapper — got swallowed into the captured text and `JSON.parse` then failed on
 * a file that was perfectly fine.
 *
 * It also only matched `window.`. `var COURSE_DATA =` and
 * `globalThis.COURSE_DATA =` are both things exports do, and both used to be
 * reported as "could not find COURSE_DATA".
 *
 * What this still cannot read is a genuine JavaScript object literal — unquoted
 * keys, single quotes, trailing commas. Canvas emits JSON, so this has not come
 * up; parsing arbitrary JS would mean shipping a JS parser to read a data file.
 */
export function parseCourseDataJs(text: string): ParseResult {
  const literal = extractCourseDataLiteral(text);
  if (literal === null) return fail({ kind: "no-course-data" });

  let data: unknown;
  try {
    data = JSON.parse(literal);
  } catch (error) {
    return fail({ kind: "invalid-json", message: error instanceof Error ? error.message : "unparseable" });
  }

  if (typeof data !== "object" || data === null) return fail({ kind: "no-course-data" });

  const collector = new AssignmentCollector();
  collectCourseData(data as Record<string, unknown>, collector);
  return ok(collector.collected());
}

/** The `{ … }` following the first `COURSE_DATA =`, or null if there isn't one. */
function extractCourseDataLiteral(text: string): string | null {
  const marker = text.indexOf(MARKER);
  if (marker === -1) return null;

  const equals = text.indexOf("=", marker + MARKER.length);
  if (equals === -1) return null;

  const open = text.indexOf("{", equals);
  if (open === -1) return null;

  // Only whitespace may sit between the `=` and the `{`. Otherwise this is
  // something like `COURSE_DATA = normalise({...})`, and the braces we would
  // capture are an argument rather than the data.
  if (text.slice(equals + 1, open).trim() !== "") return null;

  return sliceBalanced(text, open);
}

/**
 * The substring from `start` (which must be `{`) to its matching `}`.
 *
 * String literals are tracked so a brace inside a title — "Essay {draft}" — does
 * not close the object early, and backslash escapes so an escaped quote does not
 * end the string early.
 */
function sliceBalanced(text: string, start: number): string | null {
  let depth = 0;
  let quote: string | null = null;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (quote !== null) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return null;
}
