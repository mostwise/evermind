"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AssignmentCard } from "@/components/assignment-card";
import { StatsCards } from "@/components/stats-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isAssignmentOverdue, isAssignmentPending } from "@/lib/dates";
import type { Assignment, Status } from "@/lib/types";

/**
 * The dashboard body: stats, the week strip, and the four status tabs.
 *
 * One component for both the signed-in dashboard and `/preview`. They used to be
 * two files repeating the same tabs, the same grid and the same empty states,
 * and the copies had already drifted — the preview tab strip scrolled on narrow
 * screens and the real one did not, for months.
 *
 * What actually differs between them is where a card's actions go: the real one
 * writes to Postgres through `AssignmentCard`'s own handlers, the preview one
 * mutates an array in memory. That is the `preview` prop and nothing else.
 */

const TABS = ["pending", "overdue", "completed", "all"] as const;
export type TabValue = (typeof TABS)[number];

export interface PreviewHandlers {
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
}

interface AssignmentsBoardProps {
  assignments: Assignment[];
  /** Rendered to the right of the heading — the add dialog, which differs per mode. */
  action: ReactNode;
  /** A banner between the heading and the stats. Preview mode uses it; the dashboard does not. */
  banner?: ReactNode;
  /** The week strip. Passed in because the dashboard lazy-loads it behind a Suspense boundary. */
  weeklyView: ReactNode;
  tab: TabValue;
  onTabChange: (tab: TabValue) => void;
  /** Present only in preview mode, where cards act on an in-memory array. */
  preview?: PreviewHandlers;
}

export function AssignmentsBoard({
  assignments,
  action,
  banner,
  weeklyView,
  tab,
  onTabChange,
  preview,
}: AssignmentsBoardProps) {
  const pending = assignments.filter((a) => isAssignmentPending(a));
  const completed = assignments.filter((a) => a.status === "completed");
  const overdue = assignments.filter((a) => isAssignmentOverdue(a));

  const groups: Record<TabValue, { rows: Assignment[]; empty: string }> = {
    pending: { rows: pending, empty: "No pending assignments" },
    overdue: { rows: overdue, empty: "No overdue assignments - great job!" },
    completed: { rows: completed, empty: "No completed assignments yet" },
    all: { rows: assignments, empty: "No assignments yet" },
  };

  const labels: Record<TabValue, string> = {
    pending: "Pending",
    overdue: "Overdue",
    completed: "Completed",
    all: "All",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Track your assignments and never miss a deadline</p>
        </div>
        {action}
      </div>

      {banner}

      <StatsCards assignments={assignments} />

      {weeklyView}

      <Tabs value={tab} onValueChange={(value) => onTabChange(value as TabValue)} className="w-full">
        <TabsList aria-label="Filter assignments by status" className="w-full justify-start overflow-x-auto">
          {TABS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {labels[value]} ({groups[value].rows.length})
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((value) => (
          <TabsContent key={value} value={value} className="mt-4">
            <AssignmentsGrid assignments={groups[value].rows} emptyMessage={groups[value].empty} preview={preview} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function AssignmentsGrid({
  assignments,
  emptyMessage,
  preview,
}: {
  assignments: Assignment[];
  emptyMessage: string;
  preview?: PreviewHandlers;
}) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/50">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          isPreview={Boolean(preview)}
          onPreviewStatusChange={preview?.onStatusChange}
          onPreviewDelete={preview?.onDelete}
        />
      ))}
    </div>
  );
}

/**
 * Which tab is showing, kept in `?tab=` so it survives navigation and can be
 * linked. "pending" is the default and so is the one value never written.
 */
export function useTabState(initial: string | null): [TabValue, (tab: TabValue) => void] {
  const [tab, setTab] = useState<TabValue>(() => asTabValue(initial));

  // history.replaceState rather than router.replace: this is a purely visual
  // change and the dashboard is force-dynamic, so a router navigation would
  // mean a server round trip to render the same page. replace, not push, so the
  // back button leaves the page instead of walking back through four tabs.
  const change = (next: TabValue) => {
    setTab(next);

    const params = new URLSearchParams(window.location.search);
    if (next === "pending") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

  return [tab, change];
}

function asTabValue(value: string | null): TabValue {
  return (TABS as readonly string[]).includes(value ?? "") ? (value as TabValue) : "pending";
}
