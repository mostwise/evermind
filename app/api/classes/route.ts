import { ApiError, json, jsonBody, validate, withUser } from "@/lib/api";
import { classDraftSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

/**
 * The student's saved classes.
 *
 * Assignments store their subject as free text and do not reference these rows,
 * so nothing here cascades: renaming or deleting a class leaves every existing
 * assignment exactly where it was.
 */

export const GET = withUser({ name: "classes-list" }, async (_request, { supabase }) => {
  const { data, error } = await supabase.from("classes").select("*").order("name", { ascending: true });

  if (error) {
    throw new ApiError(502, "We could not load your classes. Please try again.");
  }

  return json(data ?? []);
});

export const POST = withUser({ name: "classes-create" }, async (request, { supabase, user }) => {
  const draft = validate(classDraftSchema, await jsonBody(request));

  const { data, error } = await supabase
    .from("classes")
    .insert({ ...draft, user_id: user.id })
    .select();

  if (error) {
    // 23505 is unique_violation. The user asked for a class that is already
    // there, which is not really a failure — but it is not this route's place
    // to decide that, so it says what happened in a sentence they can act on.
    if (error.code === "23505") {
      throw new ApiError(409, `You already have a class called “${draft.name}”.`);
    }

    console.error("Could not create class:", error);
    throw new ApiError(502, "We could not save this class. It has not been added.");
  }

  return json(data?.[0] ?? null, { status: 201 });
});
