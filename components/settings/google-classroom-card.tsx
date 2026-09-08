"use client";

import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import GoogleIcon from "@/components/icons/GoogleIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Settings → Assignments → Google Classroom.
 *
 * **Not implemented.** The button waits a second and says so. Moved into its own
 * file unchanged so that replacing it with the real OAuth flow touches one file
 * rather than the middle of a thousand-line component.
 */
export function GoogleClassroomCard() {
  const [status, setStatus] = useState<"idle" | "loading" | "connected" | "error">("idle");

  const handleConnect = () => {
    setStatus("loading");
    // TODO: Implement actual Google Classroom OAuth flow
    setTimeout(() => {
      setStatus("idle");
      alert("Google Classroom integration is not yet implemented. This is a placeholder for the OAuth flow.");
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GoogleIcon className="h-5 w-5" />
          Google Classroom
        </CardTitle>
        <CardDescription>Connect your Google Classroom account to automatically import assignments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              {status === "connected" ? (
                <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-emerald-500" />
              ) : (
                <ExternalLink aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">{status === "connected" ? "Connected" : "Not connected"}</p>
                <p className="text-sm text-muted-foreground">
                  {status === "connected"
                    ? "Assignments will sync automatically"
                    : "Connect to import your classroom assignments"}
                </p>
              </div>
            </div>
            <Button
              onClick={handleConnect}
              disabled={status === "loading"}
              aria-busy={status === "loading"}
              variant={status === "connected" ? "outline" : "default"}
            >
              {status === "loading" && <Loader2 aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />}
              {status === "connected" ? "Disconnect" : "Connect"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            We'll only access your classroom assignments and courses. You can disconnect at any time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
