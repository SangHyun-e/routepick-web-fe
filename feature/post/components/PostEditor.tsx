'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onReady?: (editor: Editor | null) => void;
  placeholder?: string;
};

export default function PostEditor({ value, onChange, onReady, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: true, autolink: true }),
      Placeholder.configure({ placeholder: placeholder ?? '내용을 입력하세요' }),
    ],
    content: value || '',
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [editor, value]);

  useEffect(() => {
    onReady?.(editor ?? null);
    return () => onReady?.(null);
  }, [editor, onReady]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <EditorContent
        editor={editor}
        className="prose prose-slate min-h-[240px] max-w-none px-4 py-3"
      />
    </div>
  );
}
