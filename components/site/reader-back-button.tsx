"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Returns to the actual previous page (falls back to home on a direct visit). */
export function ReaderBackButton({ siteName }: { siteName?: string }) {
  const router = useRouter();
  // Always home. history.back() sent readers to whatever they were on before
  // the outlet — often another publisher's site — which is not what a button
  // labelled "Back to <site>" promises.
  const goBack = () => router.push("/");
  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Back to {siteName || "home"}</span>
      <span className="sm:hidden">Back</span>
    </button>
  );
}
