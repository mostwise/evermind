"use client";

import { AssignmentForm, assignmentToForm } from "@/components/assignments/assignment-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAssignmentMutation } from "@/hooks/use-assignment-mutation";
import { useSubjectOptions } from "@/hooks/use-classes";
import { type AssignmentDraft, updateAssignment } from "@/lib/data/assignments";
import type { Assignment } from "@/lib/types";

interface EditAssignmentDialogProps {
  assignment: Assignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Where focus should go when this closes. The caller opens it from a dropdown
   * item that is unmounted by the time the dialog closes, so Radix's own restore
   * has nothing to aim at and focus falls to `<body>`.
   */
  onCloseAutoFocus?: (event: Event) => void;
}

export function EditAssignmentDialog({ assignment, open, onOpenChange, onCloseAutoFocus }: EditAssignmentDialogProps) {
  const subjectOptions = useSubjectOptions();
  const { runMutation, isPending } = useAssignmentMutation();

  const handleSubmit = async (draft: AssignmentDraft) => {
    const saved = await runMutation(() => updateAssignment(assignment.id, draft), "Could not save your changes");

    // Stay open on failure: the edits are only in this form, and closing would
    // discard them while the list quietly revalidated back to the old row.
    if (saved) onOpenChange(false);
    return saved;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>Update the assignment details below.</DialogDescription>
        </DialogHeader>
        {/* The form lives inside DialogContent, which Radix unmounts on close, so
            it re-seeds from the assignment on every open. That is what the effect
            watching [open, assignment] used to do by hand. */}
        <AssignmentForm
          initialValues={assignmentToForm(assignment)}
          subjectOptions={subjectOptions}
          submitLabel="Save Changes"
          pendingLabel="Saving..."
          isPending={isPending}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
