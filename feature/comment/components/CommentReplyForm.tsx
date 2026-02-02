'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createReplyComment } from '@/feature/comment/api';

interface Props {
  postId: number;
  parentId: number;
  prefill?: string; // "@nickname " 같은 기본 입력값
  onCancel: () => void;
  onSubmitted: () => Promise<void>;
}

export default function CommentReplyForm({
  postId,
  parentId,
  prefill,
  onCancel,
  onSubmitted,
}: Props) {
  const [content, setContent] = useState<string>(prefill ?? '');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // parent 바뀌거나 prefill 바뀌면 동기화
    setContent(prefill ?? '');
  }, [parentId, prefill]);

  const onSubmit = async () => {
    const trimmed: string = content.trim();

    if (trimmed.length === 0) {
      toast.error('답글 내용을 입력해주세요.');
      return;
    }
    if (trimmed.length > 1000) {
      toast.error('답글은 최대 1000자까지 입력할 수 있습니다.');
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
        toast.error(res.message ?? '답글 작성에 실패했습니다.');
        return;
      }

      toast.success('답글이 등록되었습니다.');
      await onSubmitted();
    } catch {
      toast.error('답글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="답글을 입력하세요."
        className="min-h-24 resize-none"
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
            onClick={onSubmit}
            disabled={submitting || content.trim().length === 0}
          >
            {submitting ? '등록 중…' : '등록'}
          </Button>
        </div>
      </div>
    </div>
  );
}
