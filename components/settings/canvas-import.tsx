"use client";

import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Plus, Settings2, Upload } from "lucide-react";
import type React from "react";
import { useId, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { useTimeZone } from "@/components/timezone-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AssignmentWriteError, createAssignments } from "@/lib/data/assignments";
import { formatDueDate, parseDueDate, zonedDayKey } from "@/lib/dates";
import { ACCEPTED_EXTENSIONS, describeParseFailure, detectAndParse, type ParsedAssignment } from "@/lib/import/canvas";
import { ASSIGNMENTS_KEY } from "@/lib/swr-keys";

type ImportStatus = "idle" | "loading" | "success" | "error";

/**
 * Settings → Assignments → Canvas Import.
 *
 * Reading the file and letting the user pick which rows to keep. Everything that
 * decides what the bytes *mean* is in `lib/import/canvas`, which is pure and
 * tested; this file only does I/O and state.
 */
export function CanvasImport() {
  const { mutate } = useSWRConfig();
  const timeZone = useTimeZone();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<ImportStatus>("idle");
  const [message, setMessage] = useState("");
  const [parsed, setParsed] = useState<ParsedAssignment[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const todayKey = zonedDayKey(new Date(), timeZone);
  const isPast = (assignment: ParsedAssignment) => zonedDayKey(parseDueDate(assignment.due_date), timeZone) < todayKey;

  const importFile = async (file: File) => {
    setStatus("loading");
    setMessage("");
    setParsed([]);

    try {
      const result = detectAndParse(file.name, await file.text());

      if (!result.ok) {
        setStatus("error");
        setMessage(describeParseFailure(result.reason));
      } else if (result.assignments.length === 0) {
        // Distinct from a parse failure: the file was readable, it just had
        // nothing datable in it. Telling the user "check the file format" here
        // sends them to look at the wrong thing.
        setStatus("error");
        setMessage(
          "That file was read successfully, but no assignments with both a title and a due date were found in it.",
        );
      } else {
        setParsed(result.assignments);
        setStatus("success");
        setMessage(
          `Found ${result.assignments.length} assignment${result.assignments.length > 1 ? "s" : ""} ready to import`,
        );
      }
    } catch {
      // Only file reading can throw now — the parsers all return a result.
      setStatus("error");
      setMessage("That file could not be read. If it is on a removable drive, copy it locally and retry.");
    }
  };

  const handlePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await importFile(file);

    // Cleared so picking the same file again still fires `change`.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // The upload box has said "or drag and drop" since it was written, and until
  // now nothing listened for a drop — the browser navigated away to the file
  // instead, losing whatever was on the page.
  const handleDrop = async (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) await importFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    // Without preventDefault on dragover the drop event never fires at all.
    event.preventDefault();
    setIsDragging(true);
  };

  const selectAll = () => setSelected(new Set(parsed.map((_, index) => index)));
  const selectNone = () => setSelected(new Set());
  const selectFuture = () =>
    setSelected(
      new Set(
        parsed
          .map((a, index) => ({ a, index }))
          .filter(({ a }) => !isPast(a))
          .map(({ index }) => index),
      ),
    );

  const toggle = (index: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleImport = async () => {
    const chosen = parsed.filter((_, index) => selected.has(index));
    if (chosen.length === 0) return;

    setIsImporting(true);

    try {
      // Through the data layer, so the import gets the same session check and
      // the same error wording as every other write. It used to build its own
      // insert and take the user id from a prop.
      await createAssignments(chosen);

      mutate(ASSIGNMENTS_KEY);
      setMessage(`Successfully imported ${chosen.length} assignment${chosen.length !== 1 ? "s" : ""}!`);
      setDialogOpen(false);
      setSelected(new Set());
      setParsed([]);
      setStatus("idle");
    } catch (error) {
      // AssignmentWriteError carries a message written for the user; anything
      // else is a bug and gets a generic one.
      setMessage(
        error instanceof AssignmentWriteError ? error.message : "An unexpected error occurred while importing",
      );
      setStatus("error");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet aria-hidden="true" className="h-5 w-5" />
          Canvas Import
        </CardTitle>
        <CardDescription>Import assignments from a Canvas course-data.js file or other export formats</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: the drop target is an
              enhancement over the label inside it, which is the keyboard and
              screen-reader path and does the same job. */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "hover:border-primary/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              // From the parser's own list, so the picker and the prose below
              // cannot drift from what `detectAndParse` will actually accept —
              // which is how the label came to offer CSV and IMSCC months after
              // both parsers were deleted (audit L16).
              accept={ACCEPTED_EXTENSIONS.join(",")}
              onChange={handlePick}
              className="hidden"
              id={fileInputId}
            />
            <label htmlFor={fileInputId} className="cursor-pointer">
              <Upload aria-hidden="true" className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground mt-1">JS (course-data.js), JSON, or XML files</p>
            </label>
          </div>

          {status === "loading" && (
            <div role="status" className="flex items-center gap-2 text-muted-foreground">
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              <span>Parsing file...</span>
            </div>
          )}

          {status === "error" && (
            <div role="alert" className="flex items-center gap-2 text-destructive">
              <AlertCircle aria-hidden="true" className="h-4 w-4" />
              <span>{message}</span>
            </div>
          )}

          {status === "success" && parsed.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div role="status" className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  <span>{message}</span>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings2 aria-hidden="true" className="h-4 w-4 mr-2" />
                      Select &amp; Import
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Select Assignments to Import</DialogTitle>
                      <DialogDescription>Choose which assignments you want to add to your dashboard</DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 py-2">
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={selectFuture}>
                        Select Future
                      </Button>
                      <Button variant="ghost" size="sm" onClick={selectNone}>
                        Clear
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto border rounded-lg divide-y min-h-0">
                      {parsed.map((assignment, index) => {
                        const past = isPast(assignment);
                        return (
                          // biome-ignore lint/a11y/noLabelWithoutControl: the control is the Radix Checkbox below, which Biome cannot see through
                          <label
                            key={index}
                            className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 ${past ? "opacity-60" : ""}`}
                          >
                            <Checkbox
                              checked={selected.has(index)}
                              onCheckedChange={() => toggle(index)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p title={assignment.title} className="font-medium text-sm truncate">
                                {assignment.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {assignment.subject} • Due: {formatDueDate(parseDueDate(assignment.due_date), timeZone)}
                                {past && " (Past)"}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {selected.size} of {parsed.length} selected
                      </p>
                      <Button
                        onClick={handleImport}
                        disabled={selected.size === 0 || isImporting}
                        aria-busy={isImporting}
                      >
                        {isImporting ? (
                          <Loader2 aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus aria-hidden="true" className="h-4 w-4 mr-2" />
                        )}
                        {isImporting ? "Importing..." : "Import Selected"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                {parsed.slice(0, 5).map((assignment, index) => (
                  <div key={index} className="p-3 text-sm">
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-muted-foreground">
                      {assignment.subject} • Due: {formatDueDate(parseDueDate(assignment.due_date), timeZone)}
                    </p>
                  </div>
                ))}
                {parsed.length > 5 && (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    +{parsed.length - 5} more assignments
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">How to get your Canvas data:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Use a Canvas data exporter browser extension</li>
              <li>Export the course-data.js file from your course</li>
              <li>Or go to Settings → Export Course Content in Canvas</li>
              <li>Upload the exported file here</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
