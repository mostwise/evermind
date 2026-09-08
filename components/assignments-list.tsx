"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { lazy, Suspense } from "react";
import useSWR from "swr";
import { AssignmentsBoard, useTabState } from "@/components/assignments/assignments-board";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAssignments } from "@/lib/data/queries";
import { ASSIGNMENTS_KEY } from "@/lib/swr-keys";
import type { Assignment } from "@/lib/types";

const WeeklyView = lazy(() => import("@/components/weekly-view").then((module) => ({ default: module.WeeklyView })));
const AddAssignmentDialog = lazy(() =>
  import("@/components/add-assignment-dialog").then((module) => ({ default: module.AddAssignmentDialog })),
);

function WeeklyViewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton key={index} className="min-h-[100px]" />
      ))}
    </div>
  );
}

function AddButtonSkeleton() {
  return <Skeleton className="h-10 w-36" />;
}

interface AssignmentsListProps {
  /** Initial data from server-side fetch - skips loading state */
  initialData?: Assignment[];
}

export function AssignmentsList({ initialData }: AssignmentsListProps) {
  // Use SWR with fallbackData for instant hydration from server-prefetched data
  const {
    data: assignments,
    error,
    isLoading,
  } = useSWR(ASSIGNMENTS_KEY, fetchAssignments, {
    fallbackData: initialData,
    revalidateOnMount: !initialData, // Only revalidate if no initial data
  });

  const searchParams = useSearchParams();
  const [tab, setTab] = useTabState(searchParams.get("tab"));

  if (isLoading) {
    return (
      <div role="status" className="flex items-center justify-center py-12">
        <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading your assignments</span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="text-center py-12">
        <p className="text-muted-foreground">Failed to load assignments</p>
      </div>
    );
  }

  return (
    <AssignmentsBoard
      assignments={assignments || []}
      tab={tab}
      onTabChange={setTab}
      action={
        <Suspense fallback={<AddButtonSkeleton />}>
          <AddAssignmentDialog />
        </Suspense>
      }
      weeklyView={
        <Suspense fallback={<WeeklyViewSkeleton />}>
          <WeeklyView assignments={assignments || []} />
        </Suspense>
      }
    />
  );
}
