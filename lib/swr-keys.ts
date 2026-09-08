/**
 * SWR cache keys.
 *
 * These were bare string literals repeated across five files, two of which
 * declared their own private `const ASSIGNMENTS_KEY = "assignments"`. A key that
 * exists in six places is a key that can be misspelled in one of them, and the
 * symptom — a mutation that writes successfully and never refreshes the list —
 * looks nothing like a typo.
 */

export const ASSIGNMENTS_KEY = "assignments";
export const CLASSES_KEY = "classes";
