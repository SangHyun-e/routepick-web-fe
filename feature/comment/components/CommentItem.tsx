// feature/comment/components/CommentItem.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Check, Heart, MessageSquare, Pencil, Trash2, X } from 'lucide-react';

import type { CommentResponse } from '@/feature/comment/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

import CommentReplyForm from '@/feature/comment/components/CommentReplyForm';
import { useCommentActions } from '@/feature/comment/hooks/useCommentAction';

/**
 * @멘션 하이라이트 렌더링
 * - "@닉네임" 패턴을 찾아서 span으로 감싸 강조
 */
function renderWithMentions(text: string) {
  const regex: RegExp = /@[\w가-힣]+/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex: number = 0;

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

/**
 * 얇은 디바이더(“대화 계속됨”)
 * - 삭제된 부모 댓글 아래에서 replies 시작 전에 보여주기
 */
function ConversationDivider() {
  return (
    <div className="my-3 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="shrink-0 text-[11px] font-medium text-slate-400">대화 계속됨</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

interface Props {
  postId: number;
  postAuthorId: number | null;
  postAuthorNickname: string | null;
  currentUserId: number | null;
  comment: CommentResponse;
  onRefresh: () => Promise<void>;
  onCountDelta: (delta: number) => void;
}

export default function CommentItem({
  postId,
  postAuthorId,
  postAuthorNickname,
  currentUserId,
  comment,
  onRefresh,
  onCountDelta,
}: Props) {
  // 1) 기본 파생값
  const isReply: boolean = comment.depth > 0;

  const isDeleted: boolean = comment.status === 'DELETED';

  const author: string = isDeleted ? '알 수 없음' : (comment.authorNickname ?? '익명');
  const created: string = new Date(comment.createdAt).toLocaleDateString();

  const isMine: boolean = Boolean(
    !isDeleted &&
      currentUserId != null &&
      comment.authorId != null &&
      currentUserId === comment.authorId,
  );

  const isPostAuthor: boolean = Boolean(
    !isDeleted &&
      postAuthorId != null &&
      comment.authorId != null &&
      postAuthorId === comment.authorId,
  );

  // 2) 답글/멘션/더보기 관련
  const [replyOpen, setReplyOpen] = useState<boolean>(false);

  const mentionPrefill: string = useMemo(() => {
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

  // 3) 수정/삭제/+좋아요 hook
  const { deleting, updating, liking, doDelete, doUpdate, doToggleLike } = useCommentActions({
    postId,
    onRefresh,
  });

  // 4) 수정 UI 상태
  const [editing, setEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>(comment.content);

  // 5) 삭제 확인 다이얼로그
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

  const onStartEdit = () => {
    setEditing(true);
    setEditValue(comment.content);
  };

  const onCancelEdit = () => {
    setEditing(false);
    setEditValue(comment.content);
  };

  const onSubmitEdit = async () => {
    const res: CommentResponse | null = await doUpdate({
      commentId: comment.id,
      payload: { content: editValue },
    });

    if (res) {
      setEditing(false);
    }
  };

  // 6) 좋아요 optimistic state
  const [liked, setLiked] = useState<boolean>(comment.isLikedByCurrentUser ?? false);
  const [likeCount, setLikeCount] = useState<number>(comment.likeCount);

  const onClickLike = async () => {
    if (isDeleted) return;

    const prevLiked: boolean = liked;
    const prevCount: number = likeCount;

    // optimistic 적용
    const nextLiked: boolean = !prevLiked;
    const nextCount: number = Math.max(0, prevCount + (nextLiked ? 1 : -1));

    setLiked(nextLiked);
    setLikeCount(nextCount);

    const data = await doToggleLike(comment.id);

    if (!data) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      return;
    }

    setLiked(data.liked);
    setLikeCount(data.likeCount);
  };

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
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{author}</span>

            {isPostAuthor && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                작성자
              </span>
            )}

            <span className="text-xs text-slate-400">{created}</span>
          </div>

          {/* 1) 삭제된 댓글일 때도 오른쪽 “폭”은 유지해서 정렬 깨짐 방지 */}
          <div className="flex min-w-[132px] justify-end">
            {/* 내 댓글이면 수정/삭제 버튼 노출 (삭제된 댓글이면 숨김) */}
            {isMine ? (
              <div className="flex items-center gap-1">
                {!editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 gap-1.5 px-2 text-slate-600"
                    onClick={onStartEdit}
                    disabled={deleting || updating}
                  >
                    <Pencil className="h-4 w-4" />
                    <span>수정</span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 gap-1.5 px-2 text-red-600 hover:text-red-700"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleting || updating}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>삭제</span>
                </Button>
              </div>
            ) : (
              <div aria-hidden="true" className="h-8 w-[132px]" />
            )}
          </div>
        </div>

        {/* content / edit */}
        {isDeleted ? (
          <p className="text-sm leading-6 whitespace-pre-wrap text-slate-400 italic">
            삭제된 댓글입니다.
          </p>
        ) : !editing ? (
          <p className="text-sm leading-6 whitespace-pre-wrap text-slate-700">
            {renderWithMentions(comment.content)}
          </p>
        ) : (
          <div className="mt-2">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="min-h-24 resize-none"
              maxLength={1000}
              disabled={updating || deleting}
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">{editValue.length}/1000</span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 gap-1.5"
                  onClick={onCancelEdit}
                  disabled={updating || deleting}
                >
                  <X className="h-4 w-4" />
                  <span>취소</span>
                </Button>
                <Button
                  type="button"
                  className="h-9 gap-1.5"
                  onClick={onSubmitEdit}
                  disabled={updating || deleting || editValue.trim().length === 0}
                >
                  <Check className="h-4 w-4" />
                  <span>저장</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* actions */}
        <div className="mt-2 flex items-center gap-2">
          {/* 좋아요 버튼 */}
          <Button
            type="button"
            variant="ghost"
            className="h-8 gap-1.5 px-2 text-sm"
            onClick={onClickLike}
            disabled={isDeleted || liking || editing}
          >
            <Heart
              className={['h-4 w-4', liked ? 'fill-rose-500 text-rose-500' : 'text-slate-500'].join(
                ' ',
              )}
            />
            <span className={liked ? 'text-rose-600' : 'text-slate-600'}>좋아요</span>
            <span className="text-slate-400">{likeCount}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-8 gap-1.5 px-2 text-sm text-slate-600"
            onClick={() => setReplyOpen((v) => !v)}
            disabled={editing || isDeleted}
          >
            <MessageSquare className="h-4 w-4" />
            <span>답글</span>
          </Button>

          {replyCount > 0 && (
            <span className="text-xs text-slate-400">
              답글 {replyCount}
              {hiddenCount > 0 && !showAllReplies ? ` · +${hiddenCount}` : ''}
            </span>
          )}
        </div>

        {/* reply form */}
        {replyOpen && !isDeleted && (
          <div className="mt-3">
            <CommentReplyForm
              postId={postId}
              parentId={comment.id}
              prefill={mentionPrefill}
              onCancel={() => setReplyOpen(false)}
              onSubmitted={async () => {
                setReplyOpen(false);
                onCountDelta(1); //
                await onRefresh();
              }}
            />
          </div>
        )}

        {/* 2) 삭제된 부모 + replies가 있으면 replies 시작 전에 “대화 계속됨” 디바이더 */}
        {isDeleted && replyCount > 0 && <ConversationDivider />}

        {/* replies list + 더보기 */}
        {replyCount > 0 && (
          <div className="mt-4 space-y-2">
            {visibleReplies.map((reply) => (
              <CommentItem
                key={reply.id}
                postId={postId}
                postAuthorId={postAuthorId}
                postAuthorNickname={postAuthorNickname}
                currentUserId={currentUserId}
                comment={reply}
                onRefresh={onRefresh}
                onCountDelta={onCountDelta}
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

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="댓글 삭제"
        description="정말 삭제할까요? 삭제한 댓글은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="destructive"
        onConfirm={async () => {
          setShowDeleteDialog(false);

          await doDelete(comment.id); // 한 번만 호출
          onCountDelta(-1); //  즉시 반영
        }}
      />
    </div>
  );
}
