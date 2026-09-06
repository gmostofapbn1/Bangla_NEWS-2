"use client";

import { useActionState } from "react";
import { CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";
import { submitSite, type SubmitState } from "@/lib/actions/submit";

const initial: SubmitState = { ok: false };

export function SubmitForm({
  categories,
}: {
  categories: { slug: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(submitSite, initial);

  if (state.ok && state.message) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-accent-soft">
          <CheckCircle2 className="h-7 w-7 text-accent" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-ink">Submission received</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          {state.message}
        </p>
        <a
          href="/submit"
          className="mt-6 inline-flex rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
        >
          Submit another site
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      {state.error && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-accent-ring bg-accent-soft px-4 py-3 text-sm text-accent-dark">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Site name" name="outlet_name" required error={state.fieldErrors?.outlet_name} placeholder="e.g. The Daily Example" />
        <Field label="Website URL" name="url" required error={state.fieldErrors?.url} placeholder="https://example.com" type="url" />

        <div className="sm:col-span-1">
          <Label htmlFor="category_suggestion">Suggested category</Label>
          <select
            id="category_suggestion"
            name="category_suggestion"
            defaultValue=""
            className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-accent"
          >
            <option value="">— Choose one —</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.title}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <Field label="Your email (optional)" name="submitter_email" error={state.fieldErrors?.submitter_email} placeholder="you@example.com" type="email" />

        <Field
          label="Your mobile number (optional)"
          name="submitter_phone"
          error={state.fieldErrors?.submitter_phone}
          placeholder="+880 1XXX-XXXXXX"
          type="tel"
        />

        <div className="sm:col-span-2">
          <Label htmlFor="logo_file">Site logo (optional)</Label>
          <input
            id="logo_file"
            name="logo_file"
            type="file"
            accept="image/*"
            aria-invalid={!!state.fieldErrors?.logo_file}
            className="mt-1.5 w-full cursor-pointer rounded-xl border border-dashed border-line bg-paper px-3.5 py-3 text-sm text-muted outline-none transition file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-white hover:border-accent focus:border-accent"
          />
          {state.fieldErrors?.logo_file ? (
            <ErrorText>{state.fieldErrors.logo_file}</ErrorText>
          ) : (
            <p className="mt-1.5 text-xs text-faint">
              Logo size: 300&times;65 &middot; PNG, JPG, WEBP or GIF, up to 2&nbsp;MB.
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Anything we should know — ownership, language, coverage area…"
            className="mt-1.5 w-full resize-y rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-accent"
          />
          {state.fieldErrors?.notes && <ErrorText>{state.fieldErrors.notes}</ErrorText>}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Submit for review
          </>
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  error,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>
        {label} {required && <span className="text-accent">*</span>}
      </Label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        aria-invalid={!!error}
        className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-accent aria-[invalid=true]:border-accent"
      />
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-ink-soft">
      {children}
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-accent">{children}</p>;
}
