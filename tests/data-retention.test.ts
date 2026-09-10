import { describe, expect, test } from "bun:test";
import {
  DEFAULT_RETENTION,
  describeRetention,
  expiredAssignmentIds,
  isValidRetentionDays,
  MAX_RETENTION_DAYS,
  MIN_RETENTION_DAYS,
  type RetentionCandidate,
  type RetentionPolicy,
  retentionCutoff,
  toRetentionPolicy,
} from "@/lib/data/retention";

/**
 * The rules that decide what gets deleted.
 *
 * This is the one piece of the application that destroys a user's work without
 * being asked to each time, and there is no undo behind it. So the assertions
 * that matter here are the negative ones — what is *not* a candidate — and they
 * are written out one by one rather than folded into a single happy-path case,
 * because each of them is a different way of losing somebody's coursework.
 */

const NOW = new Date("2026-09-10T12:00:00.000Z");

/** Days before NOW, as the timestamp Postgres would have returned. */
function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function completed(id: string, completedDaysAgo: number): RetentionCandidate {
  return { id, status: "completed", completed_at: daysAgo(completedDaysAgo) };
}

const MONTHLY: RetentionPolicy = { enabled: true, deleteAfterDays: 30 };

describe("what is a candidate for deletion", () => {
  test("a completed assignment older than the period", () => {
    expect(expiredAssignmentIds([completed("old", 31)], MONTHLY, NOW)).toEqual(["old"]);
  });

  test("but not one that is younger", () => {
    expect(expiredAssignmentIds([completed("recent", 29)], MONTHLY, NOW)).toEqual([]);
  });

  test("and not one completed exactly on the boundary", () => {
    // Strictly older than the cutoff, so the row that is precisely N days old
    // survives. A boundary has to fall one way; it falls towards keeping.
    expect(expiredAssignmentIds([completed("exactly", 30)], MONTHLY, NOW)).toEqual([]);
  });

  test("only the expired ones, out of a mixed list", () => {
    const assignments = [completed("a", 90), completed("b", 5), completed("c", 45)];

    expect(expiredAssignmentIds(assignments, MONTHLY, NOW)).toEqual(["a", "c"]);
  });
});

describe("what is never a candidate, however old", () => {
  test("anything still pending", () => {
    // The single most important line in this file. An assignment nobody has
    // ticked off is not finished work, it is work being avoided, and deleting
    // it would silently remove the thing the user most needs to see.
    const ancient: RetentionCandidate = { id: "overdue", status: "pending", completed_at: null };

    expect(expiredAssignmentIds([ancient], MONTHLY, NOW)).toEqual([]);
  });

  test("a completed row with no completion date", () => {
    // The database trigger sets this column, so a null here means something
    // upstream is wrong. "We do not know how old this is" must not resolve to
    // "delete it".
    const undated: RetentionCandidate = { id: "undated", status: "completed", completed_at: null };

    expect(expiredAssignmentIds([undated], MONTHLY, NOW)).toEqual([]);
  });

  test("a completed row whose completion date will not parse", () => {
    const broken: RetentionCandidate = { id: "broken", status: "completed", completed_at: "not a timestamp" };

    expect(expiredAssignmentIds([broken], MONTHLY, NOW)).toEqual([]);
  });

  test("anything at all, when the policy is off", () => {
    const off: RetentionPolicy = { enabled: false, deleteAfterDays: 1 };

    expect(expiredAssignmentIds([completed("ancient", 4000)], off, NOW)).toEqual([]);
  });

  test("anything at all, when the number of days is nonsense", () => {
    // A negative period would put the cutoff in the future and expire the whole
    // account in one sweep. `retentionCutoff` refuses rather than computing it.
    for (const days of [0, -30, 1.5, Number.NaN, MAX_RETENTION_DAYS + 1]) {
      const policy: RetentionPolicy = { enabled: true, deleteAfterDays: days };

      expect(retentionCutoff(policy, NOW)).toBeNull();
      expect(expiredAssignmentIds([completed("today", 0)], policy, NOW)).toEqual([]);
    }
  });
});

describe("the bounds", () => {
  test("accept the ends of the range and the default", () => {
    expect(isValidRetentionDays(MIN_RETENTION_DAYS)).toBe(true);
    expect(isValidRetentionDays(MAX_RETENTION_DAYS)).toBe(true);
    expect(isValidRetentionDays(DEFAULT_RETENTION.deleteAfterDays)).toBe(true);
  });

  test("reject everything outside it", () => {
    expect(isValidRetentionDays(MIN_RETENTION_DAYS - 1)).toBe(false);
    expect(isValidRetentionDays(MAX_RETENTION_DAYS + 1)).toBe(false);
  });
});

describe("reading a settings row", () => {
  test("no row means the default", () => {
    expect(toRetentionPolicy(null)).toEqual(DEFAULT_RETENTION);
  });

  test("the default is on, and a month", () => {
    // Asserted rather than assumed, because this value is what an account gets
    // when nothing in the product has ever asked it a question.
    expect(DEFAULT_RETENTION).toEqual({ enabled: true, deleteAfterDays: 30 });
  });

  test("a row is taken at its word", () => {
    expect(toRetentionPolicy({ enabled: true, delete_after_days: 7 })).toEqual({
      enabled: true,
      deleteAfterDays: 7,
    });
    expect(toRetentionPolicy({ enabled: false, delete_after_days: 365 })).toEqual({
      enabled: false,
      deleteAfterDays: 365,
    });
  });

  test("an out-of-range row falls back to the default period", () => {
    // The CHECK constraint should make this impossible. If it ever happens, a
    // sane period is a better answer than a cutoff computed from nonsense.
    expect(toRetentionPolicy({ enabled: true, delete_after_days: -1 })).toEqual(DEFAULT_RETENTION);
  });
});

describe("describing the policy", () => {
  test("says plainly when nothing is deleted", () => {
    expect(describeRetention({ enabled: false, deleteAfterDays: 30 })).toBe(
      "Completed assignments are kept until you delete them.",
    );
  });

  test("uses words for the periods people actually pick", () => {
    expect(describeRetention({ enabled: true, deleteAfterDays: 1 })).toContain("a day after");
    expect(describeRetention({ enabled: true, deleteAfterDays: 7 })).toContain("a week after");
    expect(describeRetention({ enabled: true, deleteAfterDays: 30 })).toContain("a month after");
    expect(describeRetention({ enabled: true, deleteAfterDays: 14 })).toContain("2 weeks after");
    expect(describeRetention({ enabled: true, deleteAfterDays: 365 })).toContain("a year after");
  });

  test("falls back to counting days", () => {
    expect(describeRetention({ enabled: true, deleteAfterDays: 45 })).toContain("45 days after");
  });

  test("every valid period produces a sentence", () => {
    for (let days = MIN_RETENTION_DAYS; days <= 400; days++) {
      const sentence = describeRetention({ enabled: true, deleteAfterDays: days });

      expect(sentence.startsWith("Completed assignments are deleted ")).toBe(true);
      expect(sentence.endsWith("after you tick them off.")).toBe(true);
      expect(sentence).not.toContain("undefined");
    }
  });
});
