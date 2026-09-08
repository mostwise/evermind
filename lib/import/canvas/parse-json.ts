import { collectCourseData, type ParsedJson } from "./course-data";
import { AssignmentCollector } from "./normalise";
import { fail, ok, type ParseResult } from "./types";

/**
 * Reads a `.json` export.
 *
 * Two shapes arrive under this extension. A Canvas `COURSE_DATA` dump saved as
 * JSON, recognised by having `modules` or `assignments`; and a flat list from a
 * spreadsheet tool or a script, which can be either a bare array or an object
 * with `items`. The flat shape has no agreed field names, hence the aliases.
 *
 * `JSON.parse` is guarded here rather than by a `try` around the whole import.
 * The old catch wrapped file reading, three parsers and four state updates
 * together and reported all of it as "check the file format", so a genuinely
 * malformed file and a bug in the collector were indistinguishable.
 */
export function parseCanvasJson(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return fail({ kind: "invalid-json", message: error instanceof Error ? error.message : "unparseable" });
  }

  const collector = new AssignmentCollector();

  if (isRecord(data) && (data.modules !== undefined || data.assignments !== undefined)) {
    collectCourseData(data, collector);
    return ok(collector.collected());
  }

  for (const item of flatItems(data)) {
    collector.add({
      title: item.title ?? item.name ?? item.assignment_name,
      subject: item.course_name ?? item.subject ?? item.course,
      description: item.description,
      dueAt: item.due_date ?? item.due_at ?? item.dueAt,
      // Points, if the export carried them. The previous version pinned this
      // branch to "medium" and threw `points_possible` away, so a flat export
      // lost the one signal it had about which work mattered.
      pointsPossible: numeric(item.points_possible ?? item.pointsPossible),
    });
  }

  return ok(collector.collected());
}

function flatItems(data: unknown): ParsedJson[] {
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.items)) return data.items;
  return [];
}

function isRecord(value: unknown): value is ParsedJson {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Exports write points as a number or as a string; anything else is no signal at all. */
function numeric(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}
