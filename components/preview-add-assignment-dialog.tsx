"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { AssignmentForm, emptyAssignmentForm } from "@/components/assignments/assignment-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AssignmentDraft } from "@/lib/data/assignments";
import type { Assignment } from "@/lib/types";

/** The demo data on the preview page uses these, so the picker has something to show. */
const PREVIEW_SUBJECTS = ["Mathematics", "History", "Physics", "English", "Chemistry", "Art"];

interface PreviewAddAssignmentDialogProps {
  onAdd: (assignment: Assignment) => void;
}

/**
 * The add dialog for `/preview`, where there is no account and nothing is saved.
 *
 * The only difference from the real one is what happens on submit: a row is
 * built in memory and handed upwards instead of being written. The form itself
 * is the same component, so a field added to one appears in the other.
 */
export function PreviewAddAssignmentDialog({ onAdd }: PreviewAddAssignmentDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (draft: AssignmentDraft) => {
    const stamp = new Date().toISOString();

    onAdd({
      ...draft,
      id: `preview-${Date.now()}`,
      user_id: "preview-user",
      status: "pending",
      created_at: stamp,
      updated_at: stamp,
    });

    setOpen(false);
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Add New Assignment</DialogTitle>
          <DialogDescription>This is a preview — nothing here is saved.</DialogDescription>
        </DialogHeader>
        <AssignmentForm
          initialValues={emptyAssignmentForm()}
          subjectOptions={PREVIEW_SUBJECTS}
          submitLabel="Add Assignment"
          pendingLabel="Adding..."
          isPending={false}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
