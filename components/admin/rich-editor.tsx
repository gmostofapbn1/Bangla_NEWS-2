"use client";

import { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Link2,
  Unlink,
  ImagePlus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Google-Docs-style rich text editor (TipTap). Writes clean HTML into a hidden
 * input so the existing post server action keeps working.
 */
export function RichEditor({
  name,
  defaultValue = "",
  placeholder = "Start writing your article… use the toolbar for headings, images, lists and more.",
  minHeight = 440,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  /** Editing box height in px — the footer pages want a shorter one than a blog post. */
  minHeight?: number;
}) {
  const [html, setHtml] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: "tiptap prose prose-neutral max-w-none px-4 py-4 focus:outline-none",
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }, [editor]);

  const onImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && json.url) {
        editor.chain().focus().setImage({ src: json.url, alt: file.name }).run();
      } else {
        window.alert(json.error || "Image upload failed.");
      }
    } catch {
      window.alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      {editor && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-band/70 px-2 py-1.5 backdrop-blur">
          <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} label="Undo" icon={Undo2} />
          <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} label="Redo" icon={Redo2} />
          <Divider />
          <Btn active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()} label="Paragraph" icon={Pilcrow} />
          <Btn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} label="Big heading (H1)" icon={Heading1} />
          <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="Heading (H2)" icon={Heading2} />
          <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="Small heading (H3)" icon={Heading3} />
          <Divider />
          <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label="Bold" icon={Bold} />
          <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italic" icon={Italic} />
          <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} label="Underline" icon={UnderlineIcon} />
          <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} label="Strikethrough" icon={Strikethrough} />
          <Divider />
          <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Bullet list" icon={List} />
          <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Numbered list" icon={ListOrdered} />
          <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="Quote" icon={Quote} />
          <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} label="Code block" icon={Code2} />
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} label="Divider" icon={Minus} />
          <Divider />
          <Btn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} label="Align left" icon={AlignLeft} />
          <Btn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} label="Align center" icon={AlignCenter} />
          <Btn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} label="Align right" icon={AlignRight} />
          <Btn active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} label="Justify" icon={AlignJustify} />
          <Divider />
          <Btn active={editor.isActive("link")} onClick={setLink} label="Add link" icon={Link2} />
          <Btn onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive("link")} label="Remove link" icon={Unlink} />
          <Btn onClick={() => fileRef.current?.click()} label="Insert image" icon={uploading ? Loader2 : ImagePlus} iconClass={uploading ? "animate-spin" : ""} disabled={uploading} />
        </div>
      )}

      <EditorContent editor={editor} />

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImageSelected} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}

function Btn({
  onClick,
  active,
  disabled,
  label,
  icon: Icon,
  iconClass,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md transition-colors disabled:opacity-40",
        active ? "bg-accent text-white" : "text-ink-soft hover:bg-surface hover:text-ink",
      )}
    >
      <Icon className={cn("h-4 w-4", iconClass)} />
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-line" aria-hidden />;
}

export type { Editor };
