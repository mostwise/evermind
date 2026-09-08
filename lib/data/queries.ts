import { toAssignments } from "@/lib/data/rows";
import { createClient } from "@/lib/supabase/client";
import type { Assignment, Class } from "@/lib/types";

/**
 * Every browser-side read, in one place.
 *
 * `fetchAssignments` existed three times — in `use-classes.ts`, in
 * `assignments-list.tsx`, and again server-side in `data/dashboard.ts` — all
 * running the same query. Three copies of a query means three places to add a
 * `deleted_at is null` filter to, and the one that gets missed shows deleted
 * rows in a corner of the app nobody looks at.
 *
 * No `user_id` filter on either. RLS is the boundary, and adding a redundant
 * client-side filter would suggest it is doing something.
 */

export async function fetchAssignments(): Promise<Assignment[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("assignments").select("*").order("due_date", { ascending: true });

  if (error) throw error;
  return toAssignments(data);
}

export async function fetchClasses(): Promise<Class[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("classes").select("*").order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
