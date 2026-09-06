"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Copy, Check, Eraser } from "lucide-react";
import {
  englishToBangla,
  unicodeToBijoy,
  bijoyToUnicode,
  toBanglaDigits,
  toEnglishDigits,
} from "@/lib/bangla";
import { cn } from "@/lib/utils";

type Tab = "phonetic" | "bijoy" | "digits";

const TABS: { id: Tab; label: string; beta?: boolean }[] = [
  { id: "phonetic", label: "English → বাংলা" },
  { id: "bijoy", label: "Bijoy ⇌ Unicode", beta: true },
  { id: "digits", label: "Digits ⇌ সংখ্যা" },
];

export function Converter() {
  const [tab, setTab] = useState<Tab>("phonetic");

  return (
    <div className="rounded-2xl border border-line bg-surface p-2 shadow-sm">
      <div className="flex flex-wrap gap-1 rounded-xl bg-band p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
              tab === t.id
                ? "bg-surface text-ink shadow-sm"
                : "text-muted hover:text-ink",
            )}
          >
            {t.label}
            {t.beta && (
              <span className="ml-1.5 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent">
                beta
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-3 sm:p-4">
        {tab === "phonetic" && <PhoneticPanel />}
        {tab === "bijoy" && <BijoyPanel />}
        {tab === "digits" && <DigitsPanel />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function PhoneticPanel() {
  const [input, setInput] = useState("amar sonar bangla");
  const output = useMemo(() => englishToBangla(input), [input]);
  return (
    <Panels
      inLabel="Type in English (phonetic)"
      outLabel="বাংলা"
      input={input}
      output={output}
      onChange={setInput}
      outputBangla
      hint="Type Banglish and read Bangla — e.g. “bangladesh” → বাংলাদেশ."
    />
  );
}

function BijoyPanel() {
  const [dir, setDir] = useState<"u2b" | "b2u">("u2b");
  const [input, setInput] = useState(dir === "u2b" ? "বাংলা সংবাদপত্র" : "");
  const output = useMemo(
    () => (dir === "u2b" ? unicodeToBijoy(input) : bijoyToUnicode(input)),
    [input, dir],
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => setDir((d) => (d === "u2b" ? "b2u" : "u2b"))}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
        >
          {dir === "u2b" ? "Unicode → Bijoy" : "Bijoy → Unicode"}
          <ArrowLeftRight className="h-4 w-4" />
        </button>
      </div>
      <Panels
        inLabel={dir === "u2b" ? "Unicode Bangla" : "Bijoy (ASCII) text"}
        outLabel={dir === "u2b" ? "Bijoy (ASCII)" : "Unicode Bangla"}
        input={input}
        output={output}
        onChange={setInput}
        outputBangla={dir === "b2u"}
        inputBangla={dir === "u2b"}
        hint="Beta — complex conjuncts may need a manual touch-up."
      />
    </div>
  );
}

function DigitsPanel() {
  const [dir, setDir] = useState<"e2b" | "b2e">("e2b");
  const [input, setInput] = useState(dir === "e2b" ? "2026" : "");
  const output = useMemo(
    () => (dir === "e2b" ? toBanglaDigits(input) : toEnglishDigits(input)),
    [input, dir],
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => setDir((d) => (d === "e2b" ? "b2e" : "e2b"))}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
        >
          {dir === "e2b" ? "123 → ১২৩" : "১২৩ → 123"}
          <ArrowLeftRight className="h-4 w-4" />
        </button>
      </div>
      <Panels
        inLabel={dir === "e2b" ? "English digits" : "Bangla digits"}
        outLabel={dir === "e2b" ? "Bangla digits" : "English digits"}
        input={input}
        output={output}
        onChange={setInput}
        outputBangla={dir === "e2b"}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Panels({
  inLabel,
  outLabel,
  input,
  output,
  onChange,
  outputBangla,
  inputBangla,
  hint,
}: {
  inLabel: string;
  outLabel: string;
  input: string;
  output: string;
  onChange: (v: string) => void;
  outputBangla?: boolean;
  inputBangla?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-faint">
              {inLabel}
            </span>
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent"
            >
              <Eraser className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => onChange(e.target.value)}
            rows={7}
            className={cn(
              "w-full resize-y rounded-xl border border-line bg-paper px-3.5 py-3 text-[15px] text-ink outline-none transition focus:border-accent",
              inputBangla && "font-bangla",
            )}
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-faint">
              {outLabel}
            </span>
            <CopyButton text={output} />
          </div>
          <div
            className={cn(
              "min-h-[calc(7rem+1.5rem)] w-full whitespace-pre-wrap break-words rounded-xl border border-line bg-band px-3.5 py-3 text-[15px] text-ink",
              outputBangla && "font-bangla",
            )}
          >
            {output || <span className="text-faint">Output appears here…</span>}
          </div>
        </div>
      </div>
      {hint && <p className="mt-3 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      disabled={!text}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent disabled:opacity-40"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" /> Copy
        </>
      )}
    </button>
  );
}
