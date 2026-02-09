'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
  Code2,
  Eraser,
  Eye,
  EyeOff,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Map,
  Palette,
  Quote,
  Redo2,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  TagIcon,
  Type,
  Underline as UnderlineIcon,
  Undo2,
  Unlink2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onReady?: (editor: Editor | null) => void;
  placeholder?: string;
  previewMeta?: {
    tags?: string[];
    latitude?: number | null;
    longitude?: number | null;
  };
};

type ColorOption = {
  label: string;
  value: string;
};

const COLOR_DEFAULT = 'default';

function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;
  if (/^[a-zA-Z][\w+.-]*:/.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

export default function PostEditor({
  value,
  onChange,
  onReady,
  placeholder,
  previewMeta,
}: Props) {
  const [isPreview, setIsPreview] = useState(false);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Placeholder.configure({ placeholder: placeholder ?? '내용을 입력하세요' }),
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight,
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none min-h-[240px] px-4 py-3 focus:outline-none',
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const rawUrl = window.prompt('링크 주소를 입력하세요.', previousUrl ?? '');
    if (rawUrl === null) return;
    const normalized = normalizeUrl(rawUrl);
    if (!normalized) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${normalized}" target="_blank" rel="noopener noreferrer">${normalized}</a>`,
        )
        .run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run();
  }, [editor]);

  const handleUnsetLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  }, [editor]);

  const toolbarTriggerClass = (active = false, disabled = false) =>
    cn(
      'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition',
      active
        ? 'border-slate-900 bg-slate-900 text-white'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      disabled && 'cursor-not-allowed opacity-40 hover:bg-white',
    );
  const toolbarIconButtonClass = (active = false, disabled = false) =>
    cn(
      'flex h-9 w-9 items-center justify-center rounded-md border text-slate-600 transition',
      active
        ? 'border-slate-900 bg-slate-900 text-white'
        : 'border-transparent bg-white hover:bg-slate-50',
      disabled && 'cursor-not-allowed opacity-40 hover:bg-white',
    );
  const toolbarGroupClass =
    'flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm';

  const isToolbarDisabled = !editor || isPreview;
  const canUndo = !isToolbarDisabled && (editor?.can().undo() ?? false);
  const canRedo = !isToolbarDisabled && (editor?.can().redo() ?? false);
  const isLinkActive = editor?.isActive('link') ?? false;
  const activeColor = (editor?.getAttributes('textStyle').color as string | undefined) ?? '';

  const colorOptions = useMemo<ColorOption[]>(
    () => [
      { label: '기본', value: COLOR_DEFAULT },
      { label: '검정', value: '#0f172a' },
      { label: '빨강', value: '#ef4444' },
      { label: '주황', value: '#f97316' },
      { label: '초록', value: '#10b981' },
      { label: '파랑', value: '#3b82f6' },
      { label: '보라', value: '#8b5cf6' },
    ],
    [],
  );

  const headingValue = useMemo(() => {
    if (!editor) return 'paragraph';
    if (editor.isActive('heading', { level: 1 })) return 'heading-1';
    if (editor.isActive('heading', { level: 2 })) return 'heading-2';
    if (editor.isActive('heading', { level: 3 })) return 'heading-3';
    return 'paragraph';
  }, [editor, selectionVersion]);

  const alignValue = useMemo(() => {
    if (!editor) return 'left';
    if (editor.isActive({ textAlign: 'center' })) return 'center';
    if (editor.isActive({ textAlign: 'right' })) return 'right';
    if (editor.isActive({ textAlign: 'justify' })) return 'justify';
    return 'left';
  }, [editor, selectionVersion]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isPreview);
  }, [editor, isPreview]);

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

  useEffect(() => {
    if (!editor) return undefined;
    const handleUpdate = () => setSelectionVersion((prev) => prev + 1);
    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);
    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [editor]);

  const previewHtml = value?.trim() ?? '';
  const formattedHtml = previewHtml.includes('<')
    ? previewHtml
    : previewHtml.replace(/\n/g, '<br />');
  const previewText = formattedHtml.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  const hasPreview = previewText.length > 0;
  const previewTags = previewMeta?.tags ?? [];
  const hasTags = previewTags.length > 0;
  const hasCoordinates =
    previewMeta?.latitude != null && previewMeta?.longitude != null;

  return (
    <div
      className={cn(
        'rounded-lg',
        isPreview ? 'border border-transparent bg-transparent' : 'border border-slate-200 bg-white',
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <div className={toolbarGroupClass}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="스타일"
                disabled={isToolbarDisabled}
                className={toolbarTriggerClass(false, isToolbarDisabled)}
              >
                <Type className="h-4 w-4" />
                스타일
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuRadioGroup
                value={headingValue}
                onValueChange={(next) => {
                  if (!editor) return;
                  if (next === 'heading-1') {
                    editor.chain().focus().toggleHeading({ level: 1 }).run();
                  } else if (next === 'heading-2') {
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                  } else if (next === 'heading-3') {
                    editor.chain().focus().toggleHeading({ level: 3 }).run();
                  } else {
                    editor.chain().focus().setParagraph().run();
                  }
                }}
              >
                <DropdownMenuRadioItem value="paragraph">
                  <Type className="h-4 w-4" />
                  본문
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="heading-1">
                  <Heading1 className="h-4 w-4" />
                  제목 1
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="heading-2">
                  <Heading2 className="h-4 w-4" />
                  제목 2
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="heading-3">
                  <Heading3 className="h-4 w-4" />
                  제목 3
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={toolbarGroupClass}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="서식"
                disabled={isToolbarDisabled}
                className={toolbarTriggerClass(false, isToolbarDisabled)}
              >
                <Bold className="h-4 w-4" />
                서식
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuCheckboxItem
                checked={editor?.isActive('bold')}
                onCheckedChange={() => editor?.chain().focus().toggleBold().run()}
              >
                <Bold className="h-4 w-4" />
                굵게
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={editor?.isActive('italic')}
                onCheckedChange={() => editor?.chain().focus().toggleItalic().run()}
              >
                <Italic className="h-4 w-4" />
                기울임
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={editor?.isActive('underline')}
                onCheckedChange={() => editor?.chain().focus().toggleUnderline().run()}
              >
                <UnderlineIcon className="h-4 w-4" />
                밑줄
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={editor?.isActive('strike')}
                onCheckedChange={() => editor?.chain().focus().toggleStrike().run()}
              >
                <Strikethrough className="h-4 w-4" />
                취소선
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={editor?.isActive('highlight')}
                onCheckedChange={() => editor?.chain().focus().toggleHighlight().run()}
              >
                <Highlighter className="h-4 w-4" />
                형광펜
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={editor?.isActive('code')}
                onCheckedChange={() => editor?.chain().focus().toggleCode().run()}
              >
                <Code className="h-4 w-4" />
                인라인 코드
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={editor?.isActive('subscript')}
                onCheckedChange={() => editor?.chain().focus().toggleSubscript().run()}
              >
                <SubscriptIcon className="h-4 w-4" />
                아래 첨자
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={editor?.isActive('superscript')}
                onCheckedChange={() => editor?.chain().focus().toggleSuperscript().run()}
              >
                <SuperscriptIcon className="h-4 w-4" />
                위 첨자
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={toolbarGroupClass}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="목록"
                disabled={isToolbarDisabled}
                className={toolbarTriggerClass(false, isToolbarDisabled)}
              >
                <List className="h-4 w-4" />
                목록
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuCheckboxItem
                checked={editor?.isActive('bulletList')}
                onCheckedChange={() => editor?.chain().focus().toggleBulletList().run()}
              >
                <List className="h-4 w-4" />
                글머리 목록
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={editor?.isActive('orderedList')}
                onCheckedChange={() => editor?.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered className="h-4 w-4" />
                번호 목록
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={editor?.isActive('taskList')}
                onCheckedChange={() => editor?.chain().focus().toggleTaskList().run()}
              >
                <ListChecks className="h-4 w-4" />
                체크리스트
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={toolbarGroupClass}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="정렬"
                disabled={isToolbarDisabled}
                className={toolbarTriggerClass(false, isToolbarDisabled)}
              >
                <AlignLeft className="h-4 w-4" />
                정렬
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuRadioGroup
                value={alignValue}
                onValueChange={(next) => editor?.chain().focus().setTextAlign(next).run()}
              >
                <DropdownMenuRadioItem value="left">
                  <AlignLeft className="h-4 w-4" />
                  왼쪽 정렬
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="center">
                  <AlignCenter className="h-4 w-4" />
                  가운데 정렬
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="right">
                  <AlignRight className="h-4 w-4" />
                  오른쪽 정렬
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="justify">
                  <AlignJustify className="h-4 w-4" />
                  양쪽 정렬
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={toolbarGroupClass}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="삽입"
                disabled={isToolbarDisabled}
                className={toolbarTriggerClass(false, isToolbarDisabled)}
              >
                <Link2 className="h-4 w-4" />
                삽입
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={handleSetLink}>
                <Link2 className="h-4 w-4" />
                링크 추가
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleUnsetLink}
                disabled={!isLinkActive}
              >
                <Unlink2 className="h-4 w-4" />
                링크 제거
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
                <Quote className="h-4 w-4" />
                인용 블록
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
                <Code2 className="h-4 w-4" />
                코드 블록
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
                <Minus className="h-4 w-4" />
                구분선
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={toolbarGroupClass}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="색상"
                disabled={isToolbarDisabled}
                className={toolbarTriggerClass(false, isToolbarDisabled)}
              >
                <Palette className="h-4 w-4" />
                색상
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuRadioGroup
                value={activeColor || COLOR_DEFAULT}
                onValueChange={(next) => {
                  if (!editor) return;
                  if (next === COLOR_DEFAULT) {
                    editor.chain().focus().unsetColor().run();
                  } else {
                    editor.chain().focus().setColor(next).run();
                  }
                }}
              >
                {colorOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    <span
                      className="h-3 w-3 rounded-full border"
                      style={{ backgroundColor: option.value === COLOR_DEFAULT ? '#ffffff' : option.value }}
                    />
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={toolbarGroupClass}>
          <button
            type="button"
            title="되돌리기"
            disabled={!canUndo}
            onClick={() => editor?.chain().focus().undo().run()}
            className={toolbarIconButtonClass(false, !canUndo)}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="다시 실행"
            disabled={!canRedo}
            onClick={() => editor?.chain().focus().redo().run()}
            className={toolbarIconButtonClass(false, !canRedo)}
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="서식 지우기"
            disabled={isToolbarDisabled}
            onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
            className={toolbarIconButtonClass(false, isToolbarDisabled)}
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>

        <div className="ml-auto flex items-center">
          <button
            type="button"
            title={isPreview ? '편집 모드로 전환' : '미리보기'}
            onClick={() => setIsPreview((prev) => !prev)}
            className={toolbarTriggerClass(isPreview, false)}
          >
            {isPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                편집
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                미리보기
              </>
            )}
          </button>
        </div>
      </div>

      <div className={cn(isPreview && 'hidden')}>
        <EditorContent editor={editor} />
      </div>
      <div className={cn(!isPreview && 'hidden')}>
        {hasPreview ? (
          <div className="py-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: formattedHtml }}
              />
              {(hasCoordinates || hasTags) && (
                <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
                  {hasCoordinates && (
                    <div className="flex items-start gap-3">
                      <Map className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" />
                      <div className="text-sm">
                        <p className="font-medium text-slate-700">위치 좌표</p>
                        <p className="mt-1 text-slate-600">
                          위도: {previewMeta?.latitude}, 경도: {previewMeta?.longitude}
                        </p>
                      </div>
                    </div>
                  )}

                  {hasTags && (
                    <div className="flex items-start gap-3">
                      <TagIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" />
                      <div className="flex flex-wrap gap-2">
                        {previewTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="px-4 py-6 text-sm text-slate-400">미리보기 내용이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
