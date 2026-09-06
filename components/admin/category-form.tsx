"use client";

import { useActionState, useState } from "react";
import { FolderTree, LayoutGrid, Palette } from "lucide-react";
import { toSlug } from "@/lib/utils";
import { upsertCategory, type FormState } from "@/lib/actions/admin";
import { Field, TextArea, Select, Checkbox, SubmitBar, ErrorBanner } from "./form-kit";
import { Card, CardDivider, FormSection } from "./ui";
import { GROUPS, DEFAULT_HOME_LIMIT } from "@/lib/site-config";
import type { Category } from "@/lib/types";

export function CategoryForm({ category }: { category: Category | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(upsertCategory, {});
  const fe = state.fieldErrors ?? {};

  // Slug mirrors the title until the admin edits it themselves. An existing
  // category counts as edited, so renaming one never silently moves its URL.
  const [title, setTitle] = useState(category?.title ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category?.slug));

  const onTitle = (v: string) => {
    setTitle(v);
    if (!slugTouched) setSlug(toSlug(v));
  };

  return (
    <form action={action}>
      <ErrorBanner message={state.error} />
      {category && <input type="hidden" name="original_slug" value={category.slug} />}

      <Card>
        <FormSection
          title="মূল তথ্য"
          description="ক্যাটাগরির নাম ও ঠিকানা — slug দিয়েই পাবলিক পেজের লিংক তৈরি হয়।"
          icon={FolderTree}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="শিরোনাম"
              name="title"
              required
              value={title}
              onChange={onTitle}
              error={fe.title}
              placeholder="Top Online Bangla News Portals"
            />
            <Field
              label="বাংলা শিরোনাম"
              name="title_bn"
              defaultValue={category?.title_bn}
              error={fe.title_bn}
              placeholder="অনলাইন বাংলা নিউজ পোর্টাল"
            />
            <Field
              label="Slug (ঐচ্ছিক)"
              name="slug"
              dir="ltr"
              value={slug}
              onChange={(v) => {
                setSlug(v);
                setSlugTouched(true);
              }}
              error={fe.slug}
              hint="ফাঁকা রাখলে শিরোনাম থেকে নিজে থেকেই তৈরি হবে। বড় হাতের অক্ষর ও একাধিক শব্দ লিখলেও চলবে — সংরক্ষণের সময় ঠিক করে নেওয়া হবে।"
              placeholder="online-portals"
            />
            <Field
              label="ক্রম (sort order)"
              name="sort_order"
              type="number"
              defaultValue={category?.sort_order ?? 0}
              error={fe.sort_order}
              hint="হোমপেজে ছোট সংখ্যা আগে দেখাবে।"
            />
          </div>
          <TextArea
            label="বর্ণনা"
            name="description"
            defaultValue={category?.description}
            error={fe.description}
            rows={3}
            hint="ক্যাটাগরি পেজের উপরে দেখানো হয়।"
          />
        </FormSection>

        <CardDivider />

        <FormSection
          title="সাজানো ও গঠন"
          description="কোন গ্রুপে পড়বে এবং কীভাবে দেখাবে।"
          icon={LayoutGrid}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="গ্রুপ"
              name="group_key"
              required
              defaultValue={category?.group ?? "portals"}
              error={fe.group_key}
              options={Object.entries(GROUPS).map(([value, label]) => ({ value, label }))}
              hint="হেডারের মেগা-মেনু এই গ্রুপ অনুযায়ী সাজানো হয়।"
            />
            <Select
              label="সেকশনের ধরন"
              name="section_type"
              defaultValue={category?.section_type ?? "outlet_grid"}
              options={[
                { value: "outlet_grid", label: "সাইট গ্রিড (লোগো টাইল)" },
                { value: "division_grid", label: "বিভাগ গ্রিড (ম্যাপ টাইল)" },
              ]}
            />
            <Field
              label="প্যারেন্ট slug"
              name="parent_slug"
              dir="ltr"
              defaultValue={category?.parent_slug}
              hint="বিভাগীয় পত্রিকার জন্য local-newspaper। শীর্ষ পর্যায়ের ক্যাটাগরি হলে ফাঁকা রাখুন।"
              placeholder=""
            />
            <Field
              label="অ্যাকসেন্ট রং"
              name="accent"
              dir="ltr"
              defaultValue={category?.accent}
              hint="হেক্স কোড, যেমন #E8A100 — বিভাগ টাইলে ব্যবহৃত হয়।"
              placeholder="#c8102e"
            />
          </div>
        </FormSection>

        <CardDivider />

        <FormSection title="প্রদর্শন" icon={Palette}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Checkbox
              label="হোমপেজে দেখান"
              name="show_on_home"
              defaultChecked={category?.home ?? false}
              hint="হোমপেজে নিজস্ব সেকশন হিসেবে আসবে"
            />
            <Checkbox
              label="সক্রিয়"
              name="is_active"
              defaultChecked={category?.is_active ?? true}
              hint="বন্ধ করলে সাইটের কোথাও দেখাবে না"
            />
          </div>
          <Field
            label="হোমপেজে সর্বোচ্চ কতটি সাইট দেখাবে"
            name="home_limit"
            type="number"
            defaultValue={category?.home_limit ?? DEFAULT_HOME_LIMIT}
            error={fe.home_limit}
            hint="প্রতিটি ক্যাটাগরির জন্য আলাদা করে ঠিক করা যায় — একটিতে ১০, আরেকটিতে ৩০, আরেকটিতে ৫০। ০ দিলে ওই ক্যাটাগরির সব সাইট হোমপেজে দেখাবে। এক সারিতে ৬টি করে সাইট বসে।"
          />
        </FormSection>

        <SubmitBar
          pending={pending}
          label={category ? "পরিবর্তন সংরক্ষণ করুন" : "ক্যাটাগরি তৈরি করুন"}
          cancelHref="/admin/categories"
        />
      </Card>
    </form>
  );
}
