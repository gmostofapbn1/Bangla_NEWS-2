"use client";

import { useActionState, useState } from "react";
import { FileText, ImageIcon, Send } from "lucide-react";
import { upsertPost, type FormState } from "@/lib/actions/admin";
import { TextArea, Checkbox, SubmitBar, ErrorBanner } from "./form-kit";
import { RichEditor } from "./rich-editor";
import { CoverImageField } from "./cover-image-field";
import { Card, CardDivider, FormSection } from "./ui";
import { toSlug } from "@/lib/utils";
import type { Post } from "@/lib/types";

export function PostForm({ post }: { post: Post | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(upsertPost, {});
  const fe = state.fieldErrors ?? {};

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));

  const onTitle = (v: string) => {
    setTitle(v);
    if (!slugTouched) setSlug(toSlug(v));
  };

  return (
    <form action={action}>
      <ErrorBanner message={state.error} />
      {post && <input type="hidden" name="id" value={post.id} />}
      {/* Preserve homepage order (managed by ↑/↓ on the posts list). */}
      <input type="hidden" name="sort_order" value={post?.sort_order ?? 0} />

      <Card>
        <FormSection title="শিরোনাম ও ঠিকানা" icon={FileText}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-[0.8125rem] font-semibold text-a-ink-soft">
                শিরোনাম <span className="text-accent">*</span>
              </label>
              <input
                id="title"
                name="title"
                value={title}
                onChange={(e) => onTitle(e.target.value)}
                aria-invalid={!!fe.title}
                placeholder="পোস্টের শিরোনাম"
                className="admin-input"
              />
              {fe.title && <p className="mt-1.5 text-xs font-medium text-accent">{fe.title}</p>}
            </div>

            <div>
              <label htmlFor="slug" className="mb-1.5 block text-[0.8125rem] font-semibold text-a-ink-soft">
                Slug <span className="font-normal text-a-faint">(ঐচ্ছিক)</span>
              </label>
              <input
                id="slug"
                name="slug"
                value={slug}
                dir="ltr"
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                aria-invalid={!!fe.slug}
                placeholder="my-first-post"
                className="admin-input"
              />
              {fe.slug ? (
                <p className="mt-1.5 text-xs font-medium text-accent">{fe.slug}</p>
              ) : (
                <p className="mt-1.5 text-xs text-a-faint">
                  ফাঁকা রাখলে শিরোনাম থেকে নিজে থেকেই তৈরি হবে। বড় হাতের অক্ষর ও
                  একাধিক শব্দ লিখলেও চলবে — সংরক্ষণের সময় ঠিক করে নেওয়া হবে।
                </p>
              )}
            </div>
          </div>

          <TextArea
            label="সংক্ষিপ্তসার"
            name="excerpt"
            defaultValue={post?.excerpt}
            error={fe.excerpt}
            rows={2}
            placeholder="ব্লগ তালিকায় যে ছোট বর্ণনাটি দেখানো হবে।"
          />
        </FormSection>

        <CardDivider />

        <FormSection title="কভার ছবি" icon={ImageIcon}>
          <CoverImageField defaultValue={post?.cover_image} error={fe.cover_image} />
        </FormSection>

        <CardDivider />

        <FormSection
          title="আর্টিকেল"
          description="টুলবার দিয়ে হেডিং, বোল্ড, তালিকা, উদ্ধৃতি এবং ছবি যোগ করুন।"
          icon={FileText}
        >
          <div>
            <RichEditor name="content" defaultValue={post?.content ?? ""} />
            {fe.content && <p className="mt-1.5 text-xs font-medium text-accent">{fe.content}</p>}
          </div>
        </FormSection>

        <CardDivider />

        <FormSection title="প্রকাশনা" icon={Send}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Checkbox
              label="প্রকাশিত"
              name="published"
              defaultChecked={post?.published ?? false}
              hint="/blog পেজে দেখা যাবে"
            />
            <Checkbox
              label="হোমপেজে ফিচার করুন"
              name="featured"
              defaultChecked={post?.featured ?? false}
              hint="হোমপেজের ব্লগ গ্রিডে আসবে"
            />
          </div>
        </FormSection>

        <SubmitBar
          pending={pending}
          label={post ? "পরিবর্তন সংরক্ষণ করুন" : "পোস্ট তৈরি করুন"}
          cancelHref="/admin/posts"
        />
      </Card>
    </form>
  );
}
