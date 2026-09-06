"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeleteButton({
  action,
  hidden,
  confirmText = "এটি মুছে ফেলবেন? এই কাজটি ফিরিয়ে আনা যাবে না।",
  label,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hidden: Record<string, string>;
  confirmText?: string;
  label?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        title={label ?? "মুছে ফেলুন"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 text-xs font-medium text-a-faint transition hover:bg-accent-soft hover:text-accent",
          className,
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {label}
      </button>
    </form>
  );
}
