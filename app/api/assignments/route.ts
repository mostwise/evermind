import { ApiError, json, jsonBody, validate, withUser } from "@/lib/api";
import { assignmentCreateSchema } from "@/lib/api/schemas";
import type { Status } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The student's assignments.
 *
 * Both handlers run against the anon client holding the caller's cookie, so
 * row-level security decides what is visible and what may be written — the same
 * boundary the browser hits when it talks to PostgREST directly. There is
 * deliberately no `.eq("user_id", …)` anywhere below: adding one would imply
 * that RLS needs the help, and the day someone believes that is the day a
 * missing filter becomes a data leak instead of a no-op.
 */

export const GET = withUser({ name: "assignments-list" }, async (_request, { supabase }) => {
  const { data, error } = await supabase.from("assignments").select("*").order("due_date", { ascending: true });

  if (error) {
    throw new ApiError(502, "We could not load your assignments. Please try again.");
  }

  return json(data ?? []);
});

export const POST = withUser(
  // Tighter than the default: a create is a write, and the Canvas import is the
  // only thing that legitimately sends many in a row — as one batch, not many
  // requests.
  { name: "assignments-create", perUser: { limit: 60, windowMs: 60 * 1000 } },
  async (request, { supabase, user }) => {
    const parsed = validate(assignmentCreateSchema, await jsonBody(request));
    const drafts = Array.isArray(parsed) ? parsed : [parsed];

    const { data, error } = await supabase
      .from("assignments")
      .insert(
        drafts.map((draft) => ({
          ...draft,
          // From the session, never from the body. A client that sends its own
          // `user_id` has it ignored here and refused by RLS underneath.
          user_id: user.id,
          status: "pending" satisfies Status,
        })),
      )
      .select();

    if (error) {
      console.error("Could not create assignments:", error);
      throw new ApiError(502, "We could not save this. It has not been added.");
    }

    // 201 with the rows, so the caller gets server-assigned ids and timestamps
    // without a second round trip.
    return json(Array.isArray(parsed) ? (data ?? []) : (data?.[0] ?? null), { status: 201 });
  },
);
