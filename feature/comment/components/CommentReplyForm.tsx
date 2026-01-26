'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createReplyComment } from '@/feature/comment/api';

interface Props {
  postId: number;
  parentId: number;
  mentionNickname: string | null;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
}

export default function CommentReplyForm({
  postId,
  parentId,
  mentionNickname,
  onSuccess,
  onCancel,
}: Props) {
  const prefix: string = mentionNickname ? `@${mentionNickname} ` : '';
  const [content, setContent] = useState<string>(prefix);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // 열리면 포커스 + 커서 맨 끝
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const submit = async () => {
    const trimmed: string = content.trim();
    if (trimmed.length === 0) {
      toast.error('댓글 내용을 입력해주세요.');
      return;
    }
    if (trimmed.length > 1000) {
      toast.error('댓글은 최대 1000자까지 입력할 수 있습니다.');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await createReplyComment(postId, parentId, { content: trimmed });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('로그인이 필요합니다.');
          return;
        }
        toast.error(res.message ?? '대댓글 작성에 실패했습니다.');
        return;
      }

      toast.success('대댓글이 등록되었습니다.');
      await onSuccess();
      onCancel();
    } catch {
      toast.error('대댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="답글을 입력하세요."
        className="min-h-20 resize-none bg-white"
        maxLength={1000}
        disabled={submitting}
      />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-500">{content.length}/1000</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            취소
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={submitting || content.trim().length === 0}
          >
            {submitting ? '등록 중…' : '등록'}
          </Button>
        </div>
      </div>
    </div>
  );
}
