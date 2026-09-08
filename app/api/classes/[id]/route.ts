import { ApiError, json, jsonBody, validate, withUser } from "@/lib/api";
import { classPatchSchema, idParamSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

export const PATCH = withUser<Params>({ name: "classes-update" }, async (request, { supabase, params }) => {
  const { id } = validate(idParamSchema, params);
  const patch = validate(classPatchSchema, await jsonBody(request));

  const { data, error } = await supabase.from("classes").update(patch).eq("id", id).select();

  if (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "You already have a class with that name.");
    }

    console.error("Could not update class:", error);
    throw new ApiError(502, "We could not save your changes. They have not been saved.");
  }

  if (!data || data.length === 0) {
    throw new ApiError(404, "That class no longer exists.");
  }

  return json(data[0]);
});

export const DELETE = withUser<Params>({ name: "classes-delete" }, async (_request, { supabase, params }) => {
  const { id } = validate(idParamSchema, params);

  const { data, error } = await supabase.from("classes").delete().eq("id", id).select();

  if (error) {
    console.error("Could not delete class:", error);
    throw new ApiError(502, "We could not delete this class. It has not been deleted.");
  }

  if (!data || data.length === 0) {
    throw new ApiError(404, "That class no longer exists.");
  }

  return json({ ok: true });
});
