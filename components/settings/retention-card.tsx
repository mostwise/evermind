import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { describeRetention, type RetentionPolicy } from "@/lib/data/retention";

/**
 * Settings → Assignments: what happens to work once it is finished.
 *
 * Read-only, and shown in every build. The clean-up runs whether or not there
 * is anything installed that can change it, so saying nothing here would mean
 * an account quietly losing completed assignments with no page anywhere that
 * admits it. This card exists to make the policy findable, not to sell an
 * alternative to it — there is no upgrade prompt here, because a build with
 * nothing to upgrade to must draw nothing at all (see `lib/pro/contract.ts`).
 *
 * A build that *does* carry the optional module replaces this card with an
 * editable one of its own. `app/settings/page.tsx` picks between them.
 *
 * `footer` is how that module reuses this wording for the account that has the
 * module but not the feature: same explanation of what is about to happen, plus
 * whatever it wants to offer underneath. It has no directive of its own, so it
 * renders on the server here and inside a client component there. Nothing is
 * drawn when it is omitted — the ordinary case, and the only possible one in a
 * build with nothing to offer.
 */
export function RetentionCard({ policy, footer }: { policy: RetentionPolicy; footer?: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" aria-hidden="true" />
          Finished work
        </CardTitle>
        <CardDescription>
          Evermind is a list of what is ahead of you, so completed assignments do not stay on it forever.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="font-medium">{describeRetention(policy)}</p>
        <p className="text-muted-foreground">
          Only assignments you have ticked off are ever removed — nothing still pending is touched, however overdue it
          is. Reopening one starts its clock again from zero.
        </p>
        <p className="text-muted-foreground">
          The clean-up runs when you open Evermind, so something may outlive the date above by a day or two if you have
          been away. Deletion cannot be undone; General → Your Data downloads everything first.
        </p>
        {footer}
      </CardContent>
    </Card>
  );
}
