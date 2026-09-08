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
import { useAssignmentMutation } from "@/hooks/use-assignment-mutation";
import { useSubjectOptions } from "@/hooks/use-classes";
import { type AssignmentDraft, createAssignment } from "@/lib/data/assignments";

export function AddAssignmentDialog() {
  const subjectOptions = useSubjectOptions();
  const { runMutation, isPending } = useAssignmentMutation();
  const [open, setOpen] = useState(false);

  const handleSubmit = async (draft: AssignmentDraft) => {
    const saved = await runMutation(() => createAssignment(draft), "Could not add this assignment");

    // Closing regardless is what made a rejected write look like a saved one.
    // Leave the form up with the user's input still in it so they can retry.
    if (saved) setOpen(false);
    return saved;
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
          <DialogDescription>Add a new assignment to track. Fill in the details below.</DialogDescription>
        </DialogHeader>
        <AssignmentForm
          initialValues={emptyAssignmentForm()}
          subjectOptions={subjectOptions}
          submitLabel="Add Assignment"
          pendingLabel="Adding..."
          isPending={isPending}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
