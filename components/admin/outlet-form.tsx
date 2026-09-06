"use client";

import { useActionState } from "react";
import { Globe, ImageIcon, SlidersHorizontal } from "lucide-react";
import { upsertOutlet, type FormState } from "@/lib/actions/admin";
import {
  Field,
  TextArea,
  Select,
  Checkbox,
  SubmitBar,
  ErrorBanner,
  ImageField,
} from "./form-kit";
import { Card, CardDivider, FormSection } from "./ui";
import type { AdminOutlet } from "@/lib/admin-queries";

export function OutletForm({
  outlet,
  categories,
  defaultCategory = "",
  returnTo = "/admin/outlets",
}: {
  outlet: AdminOutlet | null;
  categories: { slug: string; title: string }[];
  defaultCategory?: string;
  returnTo?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(upsertOutlet, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action}>
      <ErrorBanner message={state.error} />
      {outlet && <input type="hidden" name="id" value={outlet.id} />}
      <input type="hidden" name="return_to" value={returnTo} />

      <Card>
        <FormSection
          title="মূল তথ্য"
          description="পাঠক কার্ডে যে নাম ও ঠিকানা দেখবে।"
          icon={Globe}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="নাম"
              name="name"
              required
              defaultValue={outlet?.name}
              error={fe.name}
              placeholder="যেমন: Prothom Alo"
            />
            <Field
              label="বাংলা নাম"
              name="name_bn"
              defaultValue={outlet?.name_bn}
              error={fe.name_bn}
              placeholder="প্রথম আলো"
            />
          </div>
          <Field
            label="ওয়েবসাইট ঠিকানা"
            name="url"
            required
            type="url"
            dir="ltr"
            defaultValue={outlet?.url}
            error={fe.url}
            placeholder="https://example.com"
          />
          <Field
            label="Slug (ঐচ্ছিক)"
            name="slug"
            dir="ltr"
            defaultValue={outlet?.slug ?? ""}
            error={fe.slug}
            placeholder="prothom-alo"
            hint={
              outlet
                ? `সাইটে ঠিকানা: /read/${outlet.slug || outlet.id}। ফাঁকা রাখলে বর্তমান slug অপরিবর্তিত থাকবে।`
                : "ফাঁকা রাখলে নাম থেকে নিজে থেকেই তৈরি হবে — যেমন /read/prothom-alo। একই slug আগে থেকে থাকলে শেষে -2, -3 বসবে।"
            }
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="ক্যাটাগরি"
              name="category_slug"
              required
              defaultValue={outlet?.category_slug ?? defaultCategory ?? ""}
              error={fe.category_slug}
              options={[
                { value: "", label: "— ক্যাটাগরি বাছুন —" },
                ...categories.map((c) => ({ value: c.slug, label: c.title })),
              ]}
            />
            <Field
              label="ক্রম (sort order)"
              name="sort_order"
              type="number"
              defaultValue={outlet?.sort_order ?? ""}
              error={fe.sort_order}
              hint={
                outlet
                  ? "ছোট সংখ্যা আগে দেখাবে।"
                  : "ফাঁকা রাখলে ক্যাটাগরির সবার শেষে যুক্ত হবে।"
              }
            />
          </div>
          <TextArea
            label="সংক্ষিপ্ত বর্ণনা"
            name="description"
            defaultValue={outlet?.description}
            error={fe.description}
            rows={3}
            hint="ঐচ্ছিক — কার্ড ও ভিউয়ারে দেখানো হয়।"
          />
        </FormSection>

        <CardDivider />

        <FormSection
          title="লোগো"
          description="লোগো না দিলে সাইটের নিজস্ব ফেভিকন ব্যবহার করা হবে।"
          icon={ImageIcon}
        >
          <Field
            label="লোগোর লিংক"
            name="logo_url"
            dir="ltr"
            defaultValue={outlet?.logo_url}
            error={fe.logo_url}
            placeholder="https://…/logo.png"
            hint="লিংক দিন, অথবা নিচ থেকে ফাইল আপলোড করুন (আপলোড অগ্রাধিকার পাবে)।"
          />
          <ImageField
            label="লোগো আপলোড"
            name="logo_file"
            currentUrl={outlet?.logo_url}
            hint="Supabase “logos” বাকেটে সংরক্ষণ করা হবে।"
          />
        </FormSection>

        <CardDivider />

        <FormSection title="প্রদর্শনের সেটিং" icon={SlidersHorizontal}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Checkbox
              label="সক্রিয়"
              name="is_active"
              defaultChecked={outlet?.is_active ?? true}
              hint="বন্ধ করলে সাইটে দেখাবে না"
            />
            <Checkbox
              label="ফিচার্ড (টপ ব্যাজ)"
              name="is_featured"
              defaultChecked={outlet?.is_featured ?? false}
              hint="কার্ডে “টপ” লেখা দেখাবে"
            />
            <Checkbox
              label="সরাসরি ওয়েবসাইটে যাবে"
              name="open_external"
              defaultChecked={outlet?.open_external ?? false}
              hint="ইন-সাইট ভিউয়ার এড়িয়ে যাবে"
            />
          </div>
        </FormSection>

        <SubmitBar
          pending={pending}
          label={outlet ? "পরিবর্তন সংরক্ষণ করুন" : "সাইটটি যোগ করুন"}
          cancelHref={returnTo}
        />
      </Card>
    </form>
  );
}
