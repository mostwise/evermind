import type { AssignmentCollector } from "./normalise";

/** An arbitrary object out of `JSON.parse`, before we have established anything about its shape. */
// biome-ignore lint/suspicious/noExplicitAny: the file being imported is untrusted third-party JSON
export type ParsedJson = Record<string, any>;

/**
 * Canvas `COURSE_DATA`, from either a `.json` export or the `window.COURSE_DATA`
 * of a `.js` file.
 *
 * The same object turns up in three places inside one export — inside modules,
 * and again in flat `assignments` and `quizzes` arrays — with the same item
 * often appearing in two of them. That is what the collector's dedupe is
 * absorbing; walking all three and letting duplicates fall out is more reliable
 * than guessing which list a given export considers authoritative.
 *
 * `data.title` is the course name and becomes the subject for everything in the
 * file, which is why a per-course export produces rows already filed correctly.
 */
export function collectCourseData(data: ParsedJson, into: AssignmentCollector): void {
  const subject = typeof data.title === "string" && data.title.trim() ? data.title : "Imported";

  const fromCourseItem = (item: ParsedJson) => ({
    title: item.title,
    subject,
    description: item.content,
    dueAt: item.dueAt,
    pointsPossible: item.pointsPossible,
  });

  for (const module of asArray(data.modules)) {
    for (const item of asArray(module?.items)) {
      if (item?.type === "Assignment" || item?.type === "Quizzes::Quiz") {
        into.add(fromCourseItem(item));
      }
    }
  }

  for (const item of asArray(data.assignments)) into.add(fromCourseItem(item));
  for (const item of asArray(data.quizzes)) into.add(fromCourseItem(item));
}

/**
 * `?? []` was not enough. These fields come from a file the user chose, so
 * `modules` being an object, a string or `null` is a thing that happens, and
 * `for...of` over a non-iterable throws — which the old single catch-all turned
 * into "check the file format" for what is really a malformed export.
 */
function asArray(value: unknown): ParsedJson[] {
  return Array.isArray(value) ? value : [];
}
