'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createReplyComment } from '@/feature/comment/api';

interface Props {
  postId: number;
  parentId: number;
  onCancel: () => void;
  onSuccess: () => Promise<void>;
}

export default function CommentReplyForm({ postId, parentId, onCancel, onSuccess }: Props) {
  const [content, setContent] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const submit = async () => {
    const trimmed: string = content.trim();

    if (trimmed.length === 0) {
      toast.error('대댓글 내용을 입력해주세요.');
      return;
    }
    if (trimmed.length > 1000) {
      toast.error('대댓글은 최대 1000자까지 입력할 수 있습니다.');
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
      setContent('');
      await onSuccess();
      onCancel(); // 작성 성공 시 폼 닫기
    } catch {
      toast.error('대댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="대댓글을 입력하세요."
        className="min-h-24 resize-none"
        maxLength={1000}
        disabled={submitting}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">{content.length}/1000</span>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            취소
          </Button>
          <Button onClick={submit} disabled={submitting || content.trim().length === 0}>
            {submitting ? '등록 중…' : '등록'}
          </Button>
        </div>
      </div>
    </div>
  );
}
