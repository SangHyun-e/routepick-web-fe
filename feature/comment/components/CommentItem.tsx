// feature/comment/components/CommentItem.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Eye,
  EyeOff,
  Heart,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import type { CommentResponse } from '@/feature/comment/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  activateAdminComment,
  hardDeleteAdminComment,
  hideAdminComment,
} from '@/feature/admin/api';

import CommentReplyForm from '@/feature/comment/components/CommentReplyForm';
import { useCommentActions } from '@/feature/comment/hooks/useCommentAction';

/**
 * "@닉네임" 멘션 하이라이트 렌더링
 * - 정규식으로 멘션 패턴을 찾아 span으로 감싸 강조
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
 * “대화 계속됨” 디바이더
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
  isAdmin: boolean;
  comment: CommentResponse;
  onRefresh: () => Promise<void>;
  /**
   * 댓글 수(루트+대댓글) 즉시 반영용
   * - 베스트댓글 섹션처럼 카운트 반영이 필요 없으면 생략 가능
   */
  onCountDelta?: (delta: number) => void;
}

export default function CommentItem({
  postId,
  postAuthorId,
  postAuthorNickname,
  currentUserId,
  isAdmin,
  comment,
  onRefresh,
  onCountDelta = () => {
    /* ignore */
  },
}: Props) {
  const router = useRouter();
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

  /**
   * replies 원본(렌더링용): DELETED 포함 유지
   * - 삭제된 답글도 화면에는 보일 수 있게(마스킹/표시 유지)
   */
  const replies: CommentResponse[] = useMemo(() => {
    const raw = comment.replies;
    return Array.isArray(raw) ? raw : [];
  }, [comment.replies]);

  /**
   * 카운트/표시용 정책:
   * - 답글 수는 ACTIVE만 카운트
   * - 목록 렌더링은 기존대로 replies(=DELETED 포함)를 사용
   */
  const activeReplies: CommentResponse[] = useMemo(() => {
    return replies.filter((r: CommentResponse) => r.status !== 'DELETED');
  }, [replies]);

  const replyCount: number = activeReplies.length;

  const [showAllReplies, setShowAllReplies] = useState<boolean>(false);

  /**
   * 렌더링에 사용할 visibleReplies
   * - 기존 UX 유지: 상위 3개(삭제 포함) 또는 전체
   */
  const visibleReplies: CommentResponse[] = useMemo(() => {
    if (showAllReplies) return replies;
    return replies.slice(0, 3);
  }, [replies, showAllReplies]);

  /**
   * hiddenCount 계산은 "ACTIVE 기준"으로 해야
   * - '답글 10 · +7' 같은 숫자에서 DELETED가 포함되지 않음
   */
  const visibleActiveCount: number = useMemo(() => {
    return visibleReplies.filter((r: CommentResponse) => r.status !== 'DELETED').length;
  }, [visibleReplies]);

  const hiddenCount: number = Math.max(0, replyCount - visibleActiveCount);

  // 3) 수정/삭제/좋아요 hook
  const { deleting, updating, liking, doDelete, doUpdate, doToggleLike } = useCommentActions({
    postId,
    onRefresh,
  });

  const [adminUpdating, setAdminUpdating] = useState<boolean>(false);
  const [showAdminDeleteDialog, setShowAdminDeleteDialog] = useState<boolean>(false);

  // 4) 수정 UI 상태
  const [editing, setEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>(comment.content);

  // 5) 삭제 확인 다이얼로그
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

  const handleAdminAction = async (action: 'hide' | 'activate' | 'hard-delete') => {
    if (adminUpdating) return;

    setAdminUpdating(true);
    try {
      const res =
        action === 'hide'
          ? await hideAdminComment(comment.id)
          : action === 'activate'
            ? await activateAdminComment(comment.id)
            : await hardDeleteAdminComment(comment.id);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          toast.error('관리자 권한이 필요합니다.');
          router.push('/login');
          return;
        }
        toast.error(res.message ?? '요청에 실패했습니다.');
        return;
      }

      if (action === 'activate') {
        toast.success('댓글이 복구되었습니다.');
        if (comment.status === 'DELETED') onCountDelta(1);
      } else {
        toast.success('댓글이 삭제되었습니다.');
        if (comment.status === 'ACTIVE') onCountDelta(-1);
      }

      await onRefresh();
    } catch {
      toast.error('요청 처리 중 오류가 발생했습니다.');
    } finally {
      setAdminUpdating(false);
    }
  };

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
      // 실패 → 롤백
      setLiked(prevLiked);
      setLikeCount(prevCount);
      return;
    }

    // 서버값 확정 반영
    setLiked(data.liked);
    setLikeCount(data.likeCount);

    toast.success(data.liked ? '좋아요!' : '좋아요 취소');
  };

  const isEdited: boolean = Boolean(
    !isDeleted && comment.updatedAt && comment.updatedAt !== comment.createdAt,
  );
  const editedTitle: string = isEdited
    ? `수정: ${new Date(comment.updatedAt as string).toLocaleString()}`
    : '';
  const replyTargetLabel = useMemo(() => {
    if (!isReply) return null;
    if (!comment.replyTargetNickname) return null;
    return `↳ @${comment.replyTargetNickname}에게 답글`;
  }, [comment.replyTargetNickname, isReply]);

  return (
    <div className={isReply ? 'ml-6' : ''}>
      <div
        className={[
          'rounded-xl border px-4 py-3',
          isReply ? 'bg-slate-50' : 'bg-white',
          isPostAuthor ? 'border-blue-200' : 'border-slate-200',
        ].join(' ')}
      >
        {/* Header */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{author}</span>

            {isPostAuthor && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                작성자
              </span>
            )}

            <span className="text-xs text-slate-400" title={editedTitle}>
              {created}
            </span>

            {isEdited && (
              <span
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                title={editedTitle}
              >
                수정됨
              </span>
            )}
          </div>

          <div className="flex min-w-[132px] justify-end">
            {isMine || isAdmin ? (
              <div className="flex flex-wrap items-center justify-end gap-1">
                {isMine && (
                  <div className="flex items-center gap-1">
                    {!editing && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 gap-1.5 px-2 text-slate-600"
                        onClick={onStartEdit}
                        disabled={deleting || updating || adminUpdating}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="text-xs">수정</span>
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 gap-1.5 px-2 text-red-600 hover:text-red-700"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={deleting || updating || adminUpdating}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-xs">삭제</span>
                    </Button>
                  </div>
                )}

                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 gap-1.5 px-2 text-slate-600"
                        disabled={adminUpdating || deleting || updating}
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="text-xs">관리자</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {comment.status === 'ACTIVE' ? (
                        <DropdownMenuItem
                          onClick={() => handleAdminAction('hide')}
                          className="text-amber-700"
                        >
                          삭제(관리자)
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleAdminAction('activate')}
                          className="text-emerald-700"
                        >
                          복구(관리자)
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowAdminDeleteDialog(true)}
                        className="text-red-600"
                      >
                        물리삭제(관리자)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ) : (
              <div aria-hidden="true" className="h-8 w-[132px]" />
            )}
          </div>
        </div>

        {replyTargetLabel && (
          <p className="mb-2 text-xs text-slate-500">{replyTargetLabel}</p>
        )}

        {/* Content / Edit */}
        {isDeleted ? (
          <p className="text-sm leading-6 whitespace-pre-wrap text-slate-400 italic">
            {comment.content}
          </p>
        ) : !editing ? (
          <p className="text-sm leading-6 whitespace-pre-wrap text-slate-700">
            {renderWithMentions(comment.content)}
          </p>
        ) : (
          <div className="mt-2 space-y-3">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="min-h-24 resize-none"
              maxLength={1000}
              disabled={updating || deleting}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{editValue.length}/1000</span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 gap-1.5 bg-transparent"
                  onClick={onCancelEdit}
                  disabled={updating || deleting}
                >
                  <X className="h-4 w-4" />
                  <span className="text-xs">취소</span>
                </Button>
                <Button
                  type="button"
                  className="h-9 gap-1.5"
                  onClick={onSubmitEdit}
                  disabled={updating || deleting || editValue.trim().length === 0}
                >
                  <Check className="h-4 w-4" />
                  <span className="text-xs">저장</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
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

          {/* ✅ 답글 수는 ACTIVE만 카운트 */}
          {replyCount > 0 && (
            <span className="text-xs text-slate-400">
              답글 {replyCount}
              {hiddenCount > 0 && !showAllReplies ? ` · +${hiddenCount}` : ''}
            </span>
          )}
        </div>

        {/* Reply Form */}
        {replyOpen && !isDeleted && (
          <div className="mt-3">
            <CommentReplyForm
              postId={postId}
              parentId={comment.id}
              prefill={mentionPrefill}
              onCancel={() => setReplyOpen(false)}
              onSubmitted={async () => {
                setReplyOpen(false);
                onCountDelta(1); // 대댓글 생성 시 즉시 카운트 반영
                await onRefresh(); // 목록 최신화
              }}
            />
          </div>
        )}

        {/* Conversation Divider */}
        {isDeleted && replies.length > 0 && <ConversationDivider />}

        {/* Replies List (렌더링은 기존처럼 DELETED 포함) */}
        {replies.length > 0 && (
          <div className="mt-4 space-y-2">
            {visibleReplies.map((reply: CommentResponse) => (
              <CommentItem
                key={reply.id}
                postId={postId}
                postAuthorId={postAuthorId}
                postAuthorNickname={postAuthorNickname}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
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

            {showAllReplies && replies.length > 3 && (
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

      {/* Delete Confirm Dialog */}
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
          const ok: boolean = await doDelete(comment.id);
          if (ok) {
            onCountDelta(-1); // 댓글 삭제 시 즉시 카운트 반영
          }
        }}
      />

      <ConfirmDialog
        open={showAdminDeleteDialog}
        onOpenChange={setShowAdminDeleteDialog}
        title="댓글 물리 삭제"
        description="정말 물리 삭제할까요? 삭제한 댓글은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="destructive"
        onConfirm={async () => {
          setShowAdminDeleteDialog(false);
          await handleAdminAction('hard-delete');
        }}
      />
    </div>
  );
}
