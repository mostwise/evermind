import { ApiError, json, jsonBody, validate, withUser } from "@/lib/api";
import { assignmentPatchSchema, idParamSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

/**
 * One assignment.
 *
 * A row belonging to somebody else is invisible to this session rather than
 * forbidden to it — RLS filters it out of the UPDATE, and Postgres reports zero
 * rows affected, not a permission error. So "not found" below covers both "no
 * such id" and "not yours", which is the right thing to tell the caller in
 * either case: distinguishing them would confirm the row exists.
 */

export const PATCH = withUser<Params>({ name: "assignments-update" }, async (request, { supabase, params }) => {
  const { id } = validate(idParamSchema, params);
  const patch = validate(assignmentPatchSchema, await jsonBody(request));

  // `updated_at` is not set here on purpose: the `handle_updated_at` trigger
  // owns it. A timestamp sent by a client is one a client can falsify, and one
  // that every write path would have to remember.
  const { data, error } = await supabase.from("assignments").update(patch).eq("id", id).select();

  if (error) {
    console.error("Could not update assignment:", error);
    throw new ApiError(502, "We could not save your changes. They have not been saved.");
  }

  if (!data || data.length === 0) {
    throw new ApiError(404, "That assignment no longer exists.");
  }

  return json(data[0]);
});

export const DELETE = withUser<Params>({ name: "assignments-delete" }, async (_request, { supabase, params }) => {
  const { id } = validate(idParamSchema, params);

  const { data, error } = await supabase.from("assignments").delete().eq("id", id).select();

  if (error) {
    console.error("Could not delete assignment:", error);
    throw new ApiError(502, "We could not delete this. It has not been deleted.");
  }

  if (!data || data.length === 0) {
    throw new ApiError(404, "That assignment no longer exists.");
  }

  return json({ ok: true });
});
