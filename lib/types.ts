import type { Tables } from "@/lib/database.types";

/**
 * Domain types.
 *
 * The row shapes are derived from `lib/database.types.ts`, which is generated
 * from the schema by `bun run types:gen`. Adding or removing a column therefore
 * shows up here — and in every consumer — without anyone having to remember to
 * edit this file, which is the drift the audit called out.
 *
 * What generation cannot give us is the two unions below. Postgres CHECK
 * constraints are not enum types, so the generator reports `priority` and
 * `status` as plain `string`. They are re-narrowed here, and the constraint in
 * the migration is what actually enforces them; if you change one, change both.
 */

export type Priority = "low" | "medium" | "high";

/**
 * There is no 'overdue'. It is derived at read time from `due_date`
 * (`isAssignmentOverdue` in `lib/dates.ts`) rather than stored, because a
 * timestamp cannot be made stale by a database column.
 */
export type Status = "pending" | "completed";

export interface Assignment extends Omit<Tables<"assignments">, "priority" | "status"> {
  priority: Priority;
  status: Status;
}

/**
 * A class the student has saved to pick from when filing an assignment.
 *
 * Assignments store their subject as free text and do not reference this row,
 * so renaming or deleting a class leaves existing assignments alone.
 */
export type Class = Tables<"classes">;
