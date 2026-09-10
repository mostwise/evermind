import { deleteExpiredAssignments, expiredAssignmentIds, readRetentionPolicy } from "@/lib/data/retention";
import { toAssignments } from "@/lib/data/rows";
import { createClient } from "@/lib/supabase/server";
import type { Assignment } from "@/lib/types";

export interface DashboardData {
  assignments: Assignment[];
}

/**
 * Fetches all dashboard data in parallel using Promise.all
 * This runs on the server for faster initial page loads
 *
 * It is also where automatic clean-up happens, which deserves a word because
 * "the dashboard loader deletes rows" is not obvious from its name.
 *
 * There is no scheduler in this project — no cron, no queue, no background
 * worker — and adding one would land on every self-hoster. So the sweep runs
 * where the data is already being read, which makes the real behaviour "removed
 * the next time you open Evermind after the period is up" rather than "removed
 * on the stroke of the thirtieth day". `docs/architecture.md` says so, and so
 * does the settings card, because a promise about deletion that is off by a few
 * days in the *keeping* direction is fine and one that is vague is not.
 *
 * The policy read runs alongside the assignments query rather than before it,
 * so the common case — nothing has expired — costs one extra parallel round
 * trip and no extra statements at all.
 */
export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createClient();

  const [assignmentsResult, policy] = await Promise.all([
    supabase.from("assignments").select("*").eq("user_id", userId).order("due_date", { ascending: true }),
    readRetentionPolicy(supabase, userId),
  ]);

  const assignments = toAssignments(assignmentsResult.data);
  const expired = expiredAssignmentIds(assignments, policy);

  if (expired.length === 0) {
    return { assignments };
  }

  // Awaited rather than fired and forgotten: the rows have to be gone before
  // the list is rendered, or the user watches work they finished last term
  // appear and then vanish on the next navigation.
  const deleted = await deleteExpiredAssignments(supabase, userId, expired);

  return { assignments: assignments.filter((assignment) => !deleted.has(assignment.id)) };
}
