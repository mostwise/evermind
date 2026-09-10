import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Automatic clean-up of completed assignments.
 *
 * Evermind is a list of what is ahead of you. Work you finished last term is
 * not that, and left alone it accumulates until the only way to find anything
 * is to filter. So completed assignments are removed once they are old enough,
 * and the account decides — within limits — what "old enough" means.
 *
 * Three properties this deliberately has:
 *
 *   - **Only completed rows are ever candidates.** Nothing pending is deleted
 *     however long it has been sitting there, because an overdue assignment is
 *     the single thing a user would least like to lose silently.
 *   - **The clock starts at completion, not at the due date.** Deleting a week
 *     after something was *due* would delete work finished yesterday that had
 *     been overdue for a fortnight — punishing exactly the person the feature
 *     is meant to help.
 *   - **A row with no `completed_at` is never a candidate.** The column is set
 *     by a database trigger (see the migration), so a null on a completed row
 *     means something is wrong upstream. Keeping the row is the safe reading of
 *     "we do not know how old this is".
 *
 * The policy lives in `retention_settings`, a table the browser may read and
 * may not write. Changing it is what the optional module sells; the default is
 * the same in every build and every account.
 */

export interface RetentionPolicy {
  /** False keeps completed work indefinitely. */
  readonly enabled: boolean;
  /** Days after completion. Meaningless when `enabled` is false. */
  readonly deleteAfterDays: number;
}

/**
 * What an account gets until something says otherwise — which, without the
 * optional module, is forever.
 *
 * Thirty days rather than a calendar month: a month is 28, 29, 30 or 31 days
 * depending on which one you are standing in, and "deleted a month after you
 * finish it" should not mean something different in February.
 */
export const DEFAULT_RETENTION: RetentionPolicy = { enabled: true, deleteAfterDays: 30 };

/** Matches the CHECK constraint on `retention_settings.delete_after_days`. */
export const MIN_RETENTION_DAYS = 1;
export const MAX_RETENTION_DAYS = 3650;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The fields the sweep needs. Narrower than `Assignment`, so the tests can be too. */
export interface RetentionCandidate {
  readonly id: string;
  readonly status: string;
  readonly completed_at: string | null;
}

export function isValidRetentionDays(days: number): boolean {
  return Number.isInteger(days) && days >= MIN_RETENTION_DAYS && days <= MAX_RETENTION_DAYS;
}

/**
 * Anything completed before this instant has expired, or null if nothing has.
 *
 * Elapsed time rather than calendar arithmetic. At this scale the difference is
 * one hour twice a year, and a rule that can be computed the same way in the
 * browser, on the server and in a test is worth more than that hour.
 */
export function retentionCutoff(policy: RetentionPolicy, now: Date = new Date()): Date | null {
  if (!policy.enabled || !isValidRetentionDays(policy.deleteAfterDays)) return null;

  return new Date(now.getTime() - policy.deleteAfterDays * MS_PER_DAY);
}

/** The ids of the rows this policy says are past keeping. */
export function expiredAssignmentIds(
  assignments: readonly RetentionCandidate[],
  policy: RetentionPolicy,
  now: Date = new Date(),
): string[] {
  const cutoff = retentionCutoff(policy, now);
  if (!cutoff) return [];

  return assignments
    .filter((assignment) => {
      if (assignment.status !== "completed" || !assignment.completed_at) return false;

      const completedAt = new Date(assignment.completed_at);
      // An unparseable timestamp is a row we cannot date. Keep it.
      if (Number.isNaN(completedAt.getTime())) return false;

      return completedAt.getTime() < cutoff.getTime();
    })
    .map((assignment) => assignment.id);
}

/**
 * The policy as a sentence, for the settings page.
 *
 * One function rather than the same three ternaries in the public card and in
 * the module's editable one, so the two cannot drift into describing the same
 * setting differently.
 */
export function describeRetention(policy: RetentionPolicy): string {
  if (!policy.enabled) {
    return "Completed assignments are kept until you delete them.";
  }

  const { deleteAfterDays: days } = policy;

  if (days === 1) return "Completed assignments are deleted a day after you tick them off.";
  if (days === 7) return "Completed assignments are deleted a week after you tick them off.";
  if (days === 30) return "Completed assignments are deleted a month after you tick them off.";
  if (days === 365) return "Completed assignments are deleted a year after you tick them off.";
  if (days % 7 === 0 && days < 70) {
    return `Completed assignments are deleted ${days / 7} weeks after you tick them off.`;
  }

  return `Completed assignments are deleted ${days} days after you tick them off.`;
}

/**
 * Turns a row into a policy, tolerating a database that disagrees with this
 * file about what a valid number of days is.
 *
 * Exported for the tests, and because the module's settings route needs the
 * same reading of the same row.
 */
export function toRetentionPolicy(row: { enabled: boolean; delete_after_days: number } | null): RetentionPolicy {
  if (!row) return DEFAULT_RETENTION;

  return {
    enabled: row.enabled,
    // A value outside the range should be impossible — the CHECK constraint
    // exists — but falling back to the default is better than computing a
    // cutoff from a negative number, which would expire everything at once.
    deleteAfterDays: isValidRetentionDays(row.delete_after_days)
      ? row.delete_after_days
      : DEFAULT_RETENTION.deleteAfterDays,
  };
}

/**
 * This account's policy, or the default.
 *
 * Never throws. A settings table that cannot be read must not take down the
 * dashboard, and the failure has to be safe in the *keeping* direction: an
 * error here returns the default, and the default deletes things. So a read
 * that failed outright is treated as "leave everything alone" rather than as
 * "apply the standard policy", because the two are only the same when the read
 * worked.
 */
export async function readRetentionPolicy(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<RetentionPolicy> {
  const { data, error } = await supabase
    .from("retention_settings")
    .select("enabled, delete_after_days")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Could not read retention settings; keeping everything this time:", error);
    return { enabled: false, deleteAfterDays: DEFAULT_RETENTION.deleteAfterDays };
  }

  return toRetentionPolicy(data);
}

/**
 * Deletes the given rows and reports which actually went.
 *
 * Returns the ids Postgres confirmed, not the ids asked for, so a caller can
 * filter its list by what really happened. A failed delete returns an empty set
 * and the rows stay on screen — hiding a row we could not delete would show the
 * user a clean list and a database that disagrees with it, and the next load
 * would bring them back.
 *
 * `user_id` is filtered as well as `id`, matching `fetchDashboardData` above
 * it. Row-level security is the actual boundary here — this runs with the
 * user's own session — so that filter is documentation, not enforcement.
 */
export async function deleteExpiredAssignments(
  supabase: SupabaseClient<Database>,
  userId: string,
  ids: readonly string[],
): Promise<Set<string>> {
  if (ids.length === 0) return new Set();

  const { data, error } = await supabase.from("assignments").delete().eq("user_id", userId).in("id", ids).select("id");

  if (error) {
    console.error("Could not delete expired assignments:", error);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.id));
}
