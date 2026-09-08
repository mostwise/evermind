"use client";

import { useState } from "react";
import { AssignmentsBoard, useTabState } from "@/components/assignments/assignments-board";
import { PreviewAddAssignmentDialog } from "@/components/preview-add-assignment-dialog";
import { WeeklyView } from "@/components/weekly-view";
import type { Assignment, Status } from "@/lib/types";

/**
 * `/preview` — the whole interface, with sample data and no account.
 *
 * Everything visible is `AssignmentsBoard`, the same component the real
 * dashboard renders. All this adds is an array in `useState` standing in for the
 * database, so nothing here reaches Supabase.
 */
export function PreviewAssignmentsList({ initialAssignments }: { initialAssignments: Assignment[] }) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  // Not URL-backed: `/preview` is a static-ish demo and the state resets on
  // reload anyway, so a linkable tab would promise more than it delivers.
  const [tab, setTab] = useTabState(null);

  const handleAdd = (assignment: Assignment) => {
    setAssignments((previous) => [assignment, ...previous]);
  };

  const handleStatusChange = (id: string, status: Status) => {
    setAssignments((previous) => previous.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const handleDelete = (id: string) => {
    setAssignments((previous) => previous.filter((a) => a.id !== id));
  };

  return (
    <AssignmentsBoard
      assignments={assignments}
      tab={tab}
      onTabChange={setTab}
      action={<PreviewAddAssignmentDialog onAdd={handleAdd} />}
      weeklyView={<WeeklyView assignments={assignments} />}
      banner={
        <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-3 text-center text-sm text-primary">
          {"Preview Mode - Changes won't be saved. Sign in with an account to persist your data."}
        </div>
      }
      preview={{ onStatusChange: handleStatusChange, onDelete: handleDelete }}
    />
  );
}
