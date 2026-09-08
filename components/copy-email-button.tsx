"use client";

import { toast } from "@/hooks/use-toast";

/**
 * The obfuscated contact address, and the click that puts the real one on the
 * clipboard.
 *
 * Split out of the privacy page so that page can be a server component. It has
 * to be one now: it asks the optional module whether there is a payment
 * processor to disclose, and that lookup reaches the database — which must not
 * be anywhere near a client bundle.
 */

interface CopyEmailButtonProps {
  /** What lands on the clipboard. */
  address: string;
  /** What the reader sees, spelled out to keep it away from scrapers. */
  label: string;
}

export function CopyEmailButton({ address, label }: CopyEmailButtonProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    toast({ title: "Email copied to clipboard!" });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="underline decoration-solid cursor-pointer hover:opacity-70 transition-opacity"
    >
      {label}
    </button>
  );
}
