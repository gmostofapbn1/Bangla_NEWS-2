"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";

/**
 * Cover image picker: paste a URL *or* upload a local file straight to the
 * Supabase 'media' bucket (via /api/admin/upload — same endpoint the rich
 * editor uses for inline images). The resolved URL is submitted as
 * `cover_image` so the existing post server action is unchanged.
 */
export function CoverImageField({
  defaultValue,
  error,
}: {
  defaultValue?: string | null;
  error?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && json.url) {
        setUrl(json.url);
      } else {
        setUploadError(json.error || "আপলোড ব্যর্থ হয়েছে।");
      }
    } catch {
      setUploadError("আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label htmlFor="cover_image" className="mb-1.5 block text-[0.8125rem] font-semibold text-a-ink-soft">
        কভার ছবি
      </label>

      {/* Submitted value — always a URL (typed or uploaded). */}
      <div className="flex gap-2">
        <input
          id="cover_image"
          name="cover_image"
          value={url}
          dir="ltr"
          onChange={(e) => setUrl(e.target.value)}
          aria-invalid={!!error}
          placeholder="https://…/cover.jpg"
          className="admin-input"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-a-sm)] border border-a-line bg-a-sunken px-4 text-sm font-semibold text-a-ink-soft transition hover:bg-a-surface hover:text-a-ink disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "আপলোড হচ্ছে…" : "আপলোড"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileSelected}
        />
      </div>

      {uploadError ? (
        <p className="mt-1.5 text-xs font-medium text-accent">{uploadError}</p>
      ) : error ? (
        <p className="mt-1.5 text-xs font-medium text-accent">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-a-faint">
          ছবির লিংক পেস্ট করুন, অথবা কম্পিউটার থেকে ফাইল আপলোড করুন (সর্বোচ্চ ৮ MB)।
        </p>
      )}

      {/* Live preview with a quick clear button. */}
      {url && (
        <div className="mt-3 flex items-start gap-3">
          <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-[10px] border border-a-line bg-a-sunken">
            {/* Use a plain <img>: cover URLs come from arbitrary hosts. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
          </div>
          <button
            type="button"
            onClick={() => setUrl("")}
            className="inline-flex items-center gap-1 rounded-[9px] border border-a-line px-2.5 py-1.5 text-xs font-semibold text-a-muted transition hover:border-accent-ring hover:bg-accent-soft hover:text-accent"
          >
            <X className="h-3 w-3" /> সরান
          </button>
        </div>
      )}
    </div>
  );
}
