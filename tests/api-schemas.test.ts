import { describe, expect, test } from "bun:test";
import { ApiError } from "@/lib/api/http";
import {
  assignmentCreateSchema,
  assignmentDraftSchema,
  assignmentPatchSchema,
  classPatchSchema,
  idParamSchema,
} from "@/lib/api/schemas";
import { validate } from "@/lib/api/validate";

/**
 * The schemas exist to turn a Postgres constraint violation into a sentence, so
 * these tests are mostly about the boundaries being in the same place as the
 * CHECK constraints in `supabase/migrations/20260904120100_*.sql`. Where the two
 * disagree, the database wins and the user gets an unreadable error — which is
 * the failure this whole layer is meant to prevent, and is invisible until
 * someone types a 301-character title.
 */

const valid = {
  title: "Reading response 4",
  subject: "English",
  description: "Chapters 9 through 12.",
  due_date: "2026-09-15T23:59:00Z",
  priority: "medium" as const,
};

describe("assignmentDraftSchema", () => {
  test("accepts a filled-in assignment", () => {
    expect(validate(assignmentDraftSchema, valid)).toMatchObject(valid);
  });

  test("trims, so a title of spaces is empty rather than saved", () => {
    expect(() => validate(assignmentDraftSchema, { ...valid, title: "   " })).toThrow(ApiError);
  });

  test("holds the line exactly where the CHECK constraint does", () => {
    // 300 for title, 200 for subject, 10000 for description — the migration's
    // numbers. One character either side of each.
    expect(validate(assignmentDraftSchema, { ...valid, title: "t".repeat(300) }).title).toHaveLength(300);
    expect(() => validate(assignmentDraftSchema, { ...valid, title: "t".repeat(301) })).toThrow(ApiError);

    expect(validate(assignmentDraftSchema, { ...valid, subject: "s".repeat(200) }).subject).toHaveLength(200);
    expect(() => validate(assignmentDraftSchema, { ...valid, subject: "s".repeat(201) })).toThrow(ApiError);

    expect(validate(assignmentDraftSchema, { ...valid, description: "d".repeat(10_000) }).description).toHaveLength(
      10_000,
    );
    expect(() => validate(assignmentDraftSchema, { ...valid, description: "d".repeat(10_001) })).toThrow(ApiError);
  });

  test("an absent, empty or blank description all become null", () => {
    // One representation in the column, whichever of the three the client sent.
    expect(validate(assignmentDraftSchema, { ...valid, description: undefined }).description).toBeNull();
    expect(validate(assignmentDraftSchema, { ...valid, description: "" }).description).toBeNull();
    expect(validate(assignmentDraftSchema, { ...valid, description: "   " }).description).toBeNull();
    expect(validate(assignmentDraftSchema, { ...valid, description: null }).description).toBeNull();
  });

  test("rejects a priority the CHECK constraint would reject", () => {
    expect(() => validate(assignmentDraftSchema, { ...valid, priority: "urgent" })).toThrow(ApiError);
  });

  test("accepts an offset timestamp, not only a Z one", () => {
    // The form sends toISOString(), but an importer may reasonably send an
    // offset, and it is the same instant.
    expect(validate(assignmentDraftSchema, { ...valid, due_date: "2026-09-15T17:00:00+01:00" })).toBeTruthy();
  });

  test("rejects something that is not a date at all", () => {
    expect(() => validate(assignmentDraftSchema, { ...valid, due_date: "next Tuesday" })).toThrow(ApiError);
  });
});

describe("assignmentCreateSchema", () => {
  test("takes one assignment or a batch of them", () => {
    expect(Array.isArray(validate(assignmentCreateSchema, valid))).toBe(false);
    expect(validate(assignmentCreateSchema, [valid, valid])).toHaveLength(2);
  });

  test("refuses an empty batch and an oversized one", () => {
    expect(() => validate(assignmentCreateSchema, [])).toThrow(ApiError);
    expect(() => validate(assignmentCreateSchema, Array(1001).fill(valid))).toThrow(ApiError);
  });
});

describe("assignmentPatchSchema", () => {
  test("accepts a single field", () => {
    expect(validate(assignmentPatchSchema, { status: "completed" })).toEqual({ status: "completed" });
  });

  test("refuses an empty patch, which would be a pointless write", () => {
    expect(() => validate(assignmentPatchSchema, {})).toThrow(ApiError);
  });

  test("refuses user_id outright rather than letting RLS be the only guard", () => {
    // The important one. Without `.strict()` this key reaches PostgREST and the
    // only thing standing between it and a re-parented row is row-level
    // security. That is enough, but it should not be the only thing.
    expect(() => validate(assignmentPatchSchema, { title: "New", user_id: "someone-else" })).toThrow(ApiError);
  });

  test("refuses id and the trigger-owned timestamps too", () => {
    expect(() => validate(assignmentPatchSchema, { id: "1" })).toThrow(ApiError);
    expect(() => validate(assignmentPatchSchema, { updated_at: "2026-01-01T00:00:00Z" })).toThrow(ApiError);
  });
});

describe("classPatchSchema", () => {
  test("accepts a rename and refuses an empty patch", () => {
    expect(validate(classPatchSchema, { name: "Chemistry" })).toEqual({ name: "Chemistry" });
    expect(() => validate(classPatchSchema, {})).toThrow(ApiError);
  });

  test("refuses user_id", () => {
    expect(() => validate(classPatchSchema, { name: "Chemistry", user_id: "someone-else" })).toThrow(ApiError);
  });
});

describe("idParamSchema", () => {
  test("accepts a uuid", () => {
    expect(validate(idParamSchema, { id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301" })).toEqual({
      id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    });
  });

  test("rejects anything that could not be a row id, before it costs a query", () => {
    expect(() => validate(idParamSchema, { id: "1 OR 1=1" })).toThrow(ApiError);
    expect(() => validate(idParamSchema, { id: "" })).toThrow(ApiError);
  });
});
