import type { Tables } from "@/lib/database.types";
import type { Assignment } from "@/lib/types";

/**
 * The one place a database row is narrowed into a domain type.
 *
 * `assignments.priority` and `assignments.status` are TEXT columns with CHECK
 * constraints. Postgres enforces the three values and the two values, but a
 * CHECK is not an enum type, so `supabase gen types` can only report `string` —
 * and `Priority`/`Status` in `lib/types.ts` are unions. Something has to bridge
 * that, and the choice is one assertion here or an assertion at every call site
 * that reads a row.
 *
 * It is one here. The assertion is sound only because the constraint exists: if
 * you widen `assignments_status_check` in a migration without widening `Status`,
 * this function starts lying and nothing will tell you. Change them together.
 *
 * Nothing else is validated. A row that reached the client came through RLS from
 * a column the database was already policing; re-checking it here would be
 * theatre, and would leave the caller with a runtime error it cannot do anything
 * useful about.
 */
export function toAssignment(row: Tables<"assignments">): Assignment {
  return row as Assignment;
}

export function toAssignments(rows: Tables<"assignments">[] | null): Assignment[] {
  return (rows ?? []) as Assignment[];
}
