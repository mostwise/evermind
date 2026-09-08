"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTimeZone } from "@/components/timezone-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addCalendarDays, formatDayKey, parseDueDate, startOfWeekKey, zonedDayKey } from "@/lib/dates";
import type { Assignment } from "@/lib/types";

interface WeeklyViewProps {
  assignments: Assignment[];
}

export function WeeklyView({ assignments }: WeeklyViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const timeZone = useTimeZone();

  // Calendar-day keys rather than Date objects: which day an assignment lands on
  // depends on the visitor's timezone, and week boundaries must not be nudged by
  // a DST transition falling inside the week.
  const todayKey = zonedDayKey(new Date(), timeZone);
  const weekStartKey = addCalendarDays(startOfWeekKey(todayKey), weekOffset * 7);
  const weekEndKey = addCalendarDays(weekStartKey, 6);
  const weekDayKeys = Array.from({ length: 7 }, (_, i) => addCalendarDays(weekStartKey, i));

  const getAssignmentsForDay = (dayKey: string) => {
    return assignments.filter(
      (a) => a.status !== "completed" && zonedDayKey(parseDueDate(a.due_date), timeZone) === dayKey,
    );
  };

  const priorityColors = {
    low: "bg-emerald-500",
    medium: "bg-amber-500",
    high: "bg-rose-500",
  };

  const getWeekLabel = () => {
    if (weekOffset === 0) return "This Week";
    if (weekOffset === 1) return "Next Week";
    if (weekOffset === -1) return "Last Week";
    const dayAndMonth: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${formatDayKey(weekStartKey, dayAndMonth)} - ${formatDayKey(weekEndKey, dayAndMonth)}`;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{getWeekLabel()}</CardTitle>
          <div className="flex items-center gap-1">
            {/* Both arrows were icon-only with no accessible name, so they were
                announced as two unlabelled buttons either side of "Today".
                `header.tsx` already had the sr-only pattern; it was not applied
                here. */}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(weekOffset - 1)}>
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">Previous week</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
            >
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(weekOffset + 1)}>
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">Next week</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* A list of days, each holding a list of assignments. It was nested
            plain <div>s, which gave a screen reader no structure at all and no
            way to tell where one day ended and the next began. */}
        <ul aria-label={`Assignments due, ${getWeekLabel().toLowerCase()}`} className="grid grid-cols-7 gap-2">
          {weekDayKeys.map((dayKey) => {
            const dayAssignments = getAssignmentsForDay(dayKey);
            const today = dayKey === todayKey;
            const fullDate = formatDayKey(dayKey, { weekday: "long", day: "numeric", month: "long" });

            return (
              <li
                key={dayKey}
                // "Today" was signalled only by a border and a tint, which is
                // colour-only information and invisible to a screen reader.
                aria-current={today ? "date" : undefined}
                className={`flex flex-col rounded-lg border p-2 min-h-[100px] ${
                  today ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="text-center mb-2">
                  <p aria-hidden="true" className="text-xs text-muted-foreground">
                    {formatDayKey(dayKey, { weekday: "short" })}
                  </p>
                  <p aria-hidden="true" className={`text-sm font-semibold ${today ? "text-primary" : ""}`}>
                    {formatDayKey(dayKey, { day: "numeric" })}
                  </p>
                  {/* The two lines above are abbreviated for space; this is what
                      is actually announced. */}
                  <span className="sr-only">
                    {fullDate}
                    {today ? " (today)" : ""}
                  </span>
                </div>
                <ul className="flex flex-col gap-1 flex-1">
                  {dayAssignments.slice(0, 2).map((assignment) => (
                    <li key={assignment.id} className="flex items-center gap-1">
                      {/* Priority was conveyed by the dot's hue alone — a WCAG
                          1.4.1 failure, and nothing at all to a screen reader or
                          to anyone who cannot separate amber from rose. */}
                      <span
                        aria-hidden="true"
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityColors[assignment.priority]}`}
                      />
                      <span className="sr-only">{assignment.priority} priority: </span>
                      <span title={assignment.title} className="text-xs truncate flex-1">
                        {assignment.title}
                      </span>
                    </li>
                  ))}
                  {dayAssignments.length > 2 && (
                    <li>
                      <Badge variant="secondary" className="text-xs w-fit px-1 py-0">
                        <span aria-hidden="true">+{dayAssignments.length - 2}</span>
                        <span className="sr-only">{dayAssignments.length - 2} more due this day</span>
                      </Badge>
                    </li>
                  )}
                </ul>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
