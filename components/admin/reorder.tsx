import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Up/down reorder control. Two tiny forms rather than one, so it keeps working
 * without JavaScript — each button is a real submit that posts the direction.
 */
export function ReorderCell({
  action,
  hidden,
  first,
  last,
  returnTo,
}: {
  action: (formData: FormData) => void | Promise<void>;
  /** Identifying fields, e.g. `{ id }` for outlets or `{ slug }` for categories. */
  hidden: Record<string, string>;
  first: boolean;
  last: boolean;
  returnTo?: string;
}) {
  return (
    <div className="inline-flex flex-col overflow-hidden rounded-[8px] border border-a-line bg-a-surface">
      <MoveButton action={action} hidden={hidden} dir="up" disabled={first} returnTo={returnTo} />
      <span className="h-px bg-a-line-soft" />
      <MoveButton action={action} hidden={hidden} dir="down" disabled={last} returnTo={returnTo} />
    </div>
  );
}

function MoveButton({
  action,
  hidden,
  dir,
  disabled,
  returnTo,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hidden: Record<string, string>;
  dir: "up" | "down";
  disabled: boolean;
  returnTo?: string;
}) {
  const Icon = dir === "up" ? ChevronUp : ChevronDown;
  return (
    <form action={action}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="hidden" name="dir" value={dir} />
      {returnTo && <input type="hidden" name="return_to" value={returnTo} />}
      <button
        type="submit"
        disabled={disabled}
        aria-label={dir === "up" ? "উপরে তুলুন" : "নিচে নামান"}
        className={cn(
          "grid h-[18px] w-6 place-items-center text-a-faint transition",
          disabled
            ? "cursor-not-allowed opacity-25"
            : "hover:bg-accent-soft hover:text-accent active:bg-accent-soft",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
