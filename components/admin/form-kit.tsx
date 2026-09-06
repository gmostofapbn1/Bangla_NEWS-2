"use client";

import Link from "next/link";
import { useId } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form controls for the admin panel. Every input shares the `.admin-input`
 * recipe from globals.css so focus rings, hover states and invalid styling stay
 * identical across ten different forms.
 */

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="admin-flash mb-5 flex items-start gap-2.5 rounded-[var(--radius-a)] border border-accent-ring bg-accent-soft px-4 py-3 text-sm text-accent-dark">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

export function SuccessBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="admin-flash mb-5 flex items-start gap-2.5 rounded-[var(--radius-a)] border border-a-ok/20 bg-a-ok-soft px-4 py-3 text-sm text-a-ok">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[0.8125rem] font-semibold text-a-ink-soft">
      {children}
      {required && <span className="ml-0.5 text-accent">*</span>}
    </label>
  );
}

function Hint({ error, hint }: { error?: string; hint?: React.ReactNode }) {
  if (error) return <p className="mt-1.5 text-xs font-medium text-accent">{error}</p>;
  if (hint) return <p className="mt-1.5 text-xs leading-relaxed text-a-faint">{hint}</p>;
  return null;
}

export function Field({
  label,
  name,
  defaultValue,
  value,
  onChange,
  error,
  required,
  type = "text",
  placeholder,
  hint,
  disabled,
  autoComplete,
  dir,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  value?: string;
  onChange?: (v: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  hint?: React.ReactNode;
  disabled?: boolean;
  autoComplete?: string;
  dir?: "ltr" | "rtl";
  className?: string;
}) {
  const controlled = value !== undefined;
  return (
    <div className={className}>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <input
        id={name}
        name={name}
        type={type}
        dir={dir}
        autoComplete={autoComplete}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={!!error}
        className="admin-input"
        {...(controlled
          ? { value, onChange: (e) => onChange?.(e.target.value) }
          : { defaultValue: defaultValue ?? "" })}
      />
      <Hint error={error} hint={hint} />
    </div>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  error,
  rows = 4,
  placeholder,
  mono,
  hint,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  error?: string;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        aria-invalid={!!error}
        dir={mono ? "ltr" : undefined}
        className={cn("admin-input resize-y leading-relaxed", mono && "font-mono text-[12.5px]")}
      />
      <Hint error={error} hint={hint} />
    </div>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
  error,
  required,
  hint,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={!!error}
        className="admin-input"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Hint error={error} hint={hint} />
    </div>
  );
}

/**
 * Switch-style checkbox. Renders a real checkbox so it posts with the form and
 * works without JavaScript; the track is styling on top of it.
 */
export function Checkbox({
  label,
  name,
  defaultChecked,
  hint,
  value = "on",
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
  value?: string;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="group flex cursor-pointer items-start gap-3 rounded-[var(--radius-a-sm)] border border-a-line bg-a-surface px-3.5 py-3 transition hover:border-a-faint/50 hover:bg-a-sunken has-[:checked]:border-accent-ring has-[:checked]:bg-accent-soft/50"
    >
      <span className="relative mt-0.5 inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-full bg-a-line transition-colors group-has-[:checked]:bg-accent">
        <input
          id={id}
          type="checkbox"
          name={name}
          value={value}
          defaultChecked={defaultChecked}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span className="pointer-events-none ml-[3px] h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-[14px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.8125rem] font-medium leading-snug text-a-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-relaxed text-a-faint">{hint}</span>}
      </span>
    </label>
  );
}

export function SubmitBar({
  pending,
  label = "সংরক্ষণ করুন",
  cancelHref,
  note,
}: {
  pending: boolean;
  label?: string;
  cancelHref?: string;
  note?: React.ReactNode;
}) {
  return (
    <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-a-line-soft pt-6">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-a-card transition hover:bg-accent-dark active:translate-y-px disabled:pointer-events-none disabled:opacity-55"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "সংরক্ষণ হচ্ছে…" : label}
      </button>
      {cancelHref && (
        <Link
          href={cancelHref}
          className="inline-flex items-center rounded-[10px] border border-a-line bg-a-surface px-4 py-2.5 text-sm font-semibold text-a-ink-soft transition hover:bg-a-sunken"
        >
          বাতিল
        </Link>
      )}
      {note && <span className="text-xs text-a-faint">{note}</span>}
    </div>
  );
}

/** File picker with a preview of whatever is already stored. */
export function ImageField({
  label,
  name,
  currentUrl,
  hint,
  removable,
  preview = "square",
}: {
  label: string;
  name: string;
  currentUrl?: string | null;
  hint?: React.ReactNode;
  /** Renders a "remove" checkbox named `remove_<key>`. */
  removable?: string;
  preview?: "square" | "wide" | "round";
}) {
  const previewCls = {
    square: "h-16 w-16 rounded-[10px]",
    wide: "h-14 w-[130px] rounded-[10px]",
    round: "h-16 w-16 rounded-full",
  }[preview];

  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-start gap-3">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt=""
            className={cn("shrink-0 border border-a-line bg-a-sunken object-contain", previewCls)}
          />
        ) : (
          <span
            className={cn(
              "grid shrink-0 place-items-center border border-dashed border-a-line bg-a-sunken text-[10px] font-medium text-a-faint",
              previewCls,
            )}
          >
            নেই
          </span>
        )}
        <div className="min-w-0 flex-1">
          <input id={name} name={name} type="file" accept="image/*" className="admin-file" />
          <Hint hint={hint} />
          {removable && currentUrl && (
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-a-muted">
              <input
                type="checkbox"
                name={`remove_${removable}`}
                className="h-3.5 w-3.5 accent-[var(--color-accent)]"
              />
              বর্তমান ছবিটি সরিয়ে ফেলুন
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
