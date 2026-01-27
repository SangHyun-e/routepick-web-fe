'use client';

import { useMemo, useState } from 'react';
import { MessageSquare, Pencil } from 'lucide-react';

import type { CommentResponse } from '@/feature/comment/types';
import { Button } from '@/components/ui/button';
import CommentReplyForm from '@/feature/comment/components/CommentReplyForm';

function renderWithMentions(text: string) {
  const regex = /@[\w가-힣]+/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex: number = 0;

  // exec는 내부적으로 lastIndex를 움직이므로, g 플래그 필수
  let match: RegExpExecArray | null = regex.exec(text);

  while (match !== null) {
    const start: number = match.index;
    const value: string = match[0];

    if (start > lastIndex) {
      nodes.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex, start)}</span>);
    }

    nodes.push(
      <span key={`m-${start}`} className="rounded bg-blue-50 px-1 py-0.5 font-medium text-blue-700">
        {value}
      </span>,
    );

    lastIndex = start + value.length;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return nodes;
}
interface Props {
  postId: number;
  postAuthorId: number | null;
  postAuthorNickname: string | null;
  currentUserId: number | null;
  comment: CommentResponse;
  onRefresh: () => Promise<void>;
}

export default function CommentItem({
  postId,
  postAuthorId,
  postAuthorNickname,
  currentUserId,
  comment,
  onRefresh,
}: Props) {
  const isReply: boolean = comment.depth > 0;
  const author: string = comment.authorNickname ?? '익명';
  const created: string = new Date(comment.createdAt).toLocaleDateString();
  const isMine: boolean = Boolean(
    currentUserId != null && comment.authorId != null && currentUserId === comment.authorId,
  );

  // 게시글 작성자 댓글 표시(배지)
  const isPostAuthor: boolean = Boolean(
    postAuthorId != null && comment.authorId != null && postAuthorId === comment.authorId,
  );

  // 답글 폼 토글 + @멘션 프리필
  const [replyOpen, setReplyOpen] = useState<boolean>(false);

  const mentionPrefill: string = useMemo(() => {
    // authorNickname이 없으면 프리필 안함
    if (!comment.authorNickname) return '';
    return `@${comment.authorNickname} `;
  }, [comment.authorNickname]);

  const replies: CommentResponse[] = useMemo(() => {
    const raw = comment.replies;
    return Array.isArray(raw) ? raw : [];
  }, [comment.replies]);
  const replyCount: number = replies.length;
  const [showAllReplies, setShowAllReplies] = useState<boolean>(false);

  const visibleReplies: CommentResponse[] = useMemo(() => {
    if (showAllReplies) return replies;
    return replies.slice(0, 3);
  }, [replies, showAllReplies]);

  const hiddenCount: number = Math.max(0, replyCount - visibleReplies.length);

  return (
    <div className={isReply ? 'ml-6' : ''}>
      <div
        className={[
          'rounded-xl border px-4 py-3',
          isReply ? 'bg-slate-50' : 'bg-white',
          isPostAuthor ? 'border-blue-200' : 'border-slate-200',
        ].join(' ')}
      >
        {/* header */}
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{author}</span>

          {isPostAuthor && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              작성자
            </span>
          )}

          <span className="text-xs text-slate-400">{created}</span>
        </div>

        {/* content (멘션 하이라이트) */}
        <p className="text-sm leading-6 whitespace-pre-wrap text-slate-700">
          {renderWithMentions(comment.content)}
        </p>

        {/* actions */}
        <div className="mt-2 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2 text-sm text-slate-600"
            onClick={() => setReplyOpen((v) => !v)}
          >
            <MessageSquare className="mr-1.5 h-4 w-4" />
            답글
          </Button>

          {replyCount > 0 && (
            <span className="text-xs text-slate-400">
              답글 {replyCount}
              {hiddenCount > 0 && !showAllReplies ? ` · +${hiddenCount}` : ''}
            </span>
          )}
          {isMine && (
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-sm text-slate-600"
              onClick={() => {
                // TODO
              }}
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              수정
            </Button>
          )}
        </div>

        {/* reply form */}
        {replyOpen && (
          <div className="mt-3">
            <CommentReplyForm
              postId={postId}
              parentId={comment.id}
              prefill={mentionPrefill}
              onCancel={() => setReplyOpen(false)}
              onSubmitted={async () => {
                setReplyOpen(false);
                await onRefresh();
              }}
            />
          </div>
        )}

        {/* replies list + 더보기 */}
        {replyCount > 0 && (
          <div className="mt-4 space-y-2">
            {visibleReplies.map((reply) => (
              <CommentItem
                key={reply.id}
                postId={postId}
                postAuthorId={postAuthorId}
                postAuthorNickname={postAuthorNickname}
                comment={reply}
                onRefresh={onRefresh}
              />
            ))}

            {!showAllReplies && hiddenCount > 0 && (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2 text-sm text-slate-600"
                  onClick={() => setShowAllReplies(true)}
                >
                  답글 {hiddenCount}개 더보기
                </Button>
              </div>
            )}

            {showAllReplies && replyCount > 3 && (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-2 text-sm text-slate-600"
                  onClick={() => setShowAllReplies(false)}
                >
                  답글 접기
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
