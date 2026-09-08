"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { ExportDataButton } from "@/components/export-data-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Settings → General: who you are, getting your data out, and deleting the lot.
 *
 * None of it is editable. Everything here comes from the OAuth provider, which
 * is why there is no form.
 */
export function GeneralTab({ user }: { user: SupabaseUser }) {
  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : "U";
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details and profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.user_metadata?.avatar_url || user.user_metadata?.picture} alt={displayName} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{displayName}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <Detail label="Email Address" value={user.email || "Not provided"} />
            <Detail label="Display Name" value={displayName} />
            <Detail label="Account Created" value={formatDate(user.created_at)} />
            <Detail label="Last Sign In" value={formatDate(user.last_sign_in_at)} />
            <Detail label="Auth Provider" value={user.app_metadata?.provider || "Email"} capitalize />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Data</CardTitle>
          <CardDescription>
            Download everything Evermind stores about you — your account details and every assignment — as a single JSON
            file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExportDataButton />
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Deleting your account removes your profile and every assignment you have saved. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog email={user.email || ""} />
        </CardContent>
      </Card>
    </>
  );
}

/**
 * One read-only field. A `<Label>` with no control is not a label, so this is a
 * plain caption over its value rather than five repeats of a broken association.
 */
function Detail({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium${capitalize ? " capitalize" : ""}`}>{value}</p>
    </div>
  );
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return "Not available";
  return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
