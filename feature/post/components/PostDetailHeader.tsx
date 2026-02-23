'use client';

import { useState } from 'react';
import { ArrowLeft, MapPin, Clock, Heart, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PostResponse } from '@/feature/post/types';
import { Button } from '@/components/ui/button';
import { usePostActions } from '@/feature/post/hooks/usePostActions';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { likePost } from '@/feature/post/api';
import { hardDeleteAdminPost, updateAdminPostNotice } from '@/feature/admin/api';

interface PostDetailHeaderProps {
  post: PostResponse;
  isOwner: boolean;
  isAdmin: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

export default function PostDetailHeader({ post, isOwner, isAdmin }: PostDetailHeaderProps) {
  const router = useRouter();
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser ?? false);
  const [isNotice, setIsNotice] = useState(post.isNotice ?? false);
  const [isLiking, setIsLiking] = useState(false);
  const [isNoticeUpdating, setIsNoticeUpdating] = useState(false);
  const [showHardDeleteDialog, setShowHardDeleteDialog] = useState(false);
  const [isHardDeleting, setIsHardDeleting] = useState(false);
  const {
    goEdit,
    confirmDelete,
    doDelete,
    showDeleteDialog,
    setShowDeleteDialog,
    hide,
    activate,
    isUpdating,
  } = usePostActions({
    postId: post.id,
  });

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    try {
      const res = await likePost(post.id);

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
          return;
        }
        toast.error(res.message ?? '좋아요 실패');
        return;
      }

      const nextLiked: boolean = !isLiked;
      setLikeCount(res.data.likeCount);
      setIsLiked(nextLiked);
      toast.success(nextLiked ? '좋아요!' : '좋아요 취소');
    } catch {
      toast.error('좋아요 중 오류가 발생했습니다.');
    } finally {
      setIsLiking(false);
    }
  };

  const showOwnerActions = isOwner;
  const showAdminSoftDelete = isAdmin && !isOwner;
  const showAdminHardDelete = isAdmin;
  const showAdminNotice = isAdmin;

  const confirmHardDelete = () => {
    setShowHardDeleteDialog(true);
  };

  const handleNoticeToggle = async () => {
    if (isNoticeUpdating) return;
    setIsNoticeUpdating(true);

    const res = await updateAdminPostNotice(post.id, !isNotice);
    setIsNoticeUpdating(false);

    if (!res.ok) {
      if (res.status === 401) {
        toast.error('로그인이 필요합니다. 다시 로그인해주세요.');
        router.push(`/login?from=/posts/${post.id}`);
        return;
      }
      if (res.status === 403) {
        toast.error('관리자 권한이 필요합니다.');
        return;
      }
      toast.error(res.message ?? '공지 설정에 실패했습니다.');
      return;
    }

    const nextNotice = !isNotice;
    setIsNotice(nextNotice);
    toast.success(nextNotice ? '공지사항으로 등록했습니다.' : '공지사항을 해제했습니다.');
    router.refresh();
  };

  const doHardDelete = async () => {
    if (isHardDeleting) return;
    setShowHardDeleteDialog(false);
    setIsHardDeleting(true);

    const res = await hardDeleteAdminPost(post.id);
    setIsHardDeleting(false);

    if (!res.ok) {
      if (res.status === 401) {
        toast.error('로그인이 필요합니다. 다시 로그인해주세요.');
        router.push(`/login?from=/posts/${post.id}`);
        return;
      }
      if (res.status === 403) {
        toast.error('관리자 권한이 필요합니다.');
        return;
      }
      if (res.status === 404) {
        toast.error('이미 삭제되었거나 존재하지 않는 게시글입니다.');
        router.push('/posts');
        return;
      }
      toast.error(res.message ?? '물리 삭제에 실패했습니다.');
      return;
    }

    toast.success('게시글이 물리 삭제되었습니다.');
    router.push('/posts');
    router.refresh();
  };

  const isEdited: boolean = Boolean(post.updatedAt && post.updatedAt !== post.createdAt);
  const editedAtText: string = isEdited ? formatDate(post.updatedAt!) : '';

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              onClick={() => router.push('/posts')}
              className="mb-6 flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로가기
            </button>

            {(showOwnerActions || showAdminSoftDelete || showAdminHardDelete) && (
              <div className="flex flex-wrap items-center gap-2">
                {showOwnerActions && (
                  <>
                    {post.status === 'ACTIVE' && (
                      <Button
                        variant="outline"
                        onClick={hide}
                        disabled={isUpdating}
                        className="border-amber-200 text-amber-700 hover:bg-amber-50"
                      >
                        <EyeOff className="mr-1 h-4 w-4" />
                        숨김
                      </Button>
                    )}
                    {post.status === 'HIDDEN' && (
                      <Button
                        variant="outline"
                        onClick={activate}
                        disabled={isUpdating}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        활성화
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={goEdit}
                      className="border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      수정
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={confirmDelete}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      삭제
                    </Button>
                  </>
                )}
                {showAdminSoftDelete && (
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    소프트삭제
                  </Button>
                )}
                {showAdminHardDelete && (
                  <Button
                    variant="destructive"
                    onClick={confirmHardDelete}
                    disabled={isHardDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    물리삭제
                  </Button>
                )}
                {showAdminNotice && (
                  <Button
                    variant="outline"
                    onClick={handleNoticeToggle}
                    disabled={isNoticeUpdating}
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    {isNotice ? '공지 해제' : '공지 등록'}
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {isNotice && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                공지사항
              </span>
            )}
            <h1 className="text-3xl font-bold text-balance text-slate-900">{post.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            {post.region && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{post.region}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />

              <span title={isEdited ? `수정: ${editedAtText}` : undefined}>
                {formatDate(post.createdAt)}
              </span>

              {isEdited && (
                <span
                  title={`수정: ${editedAtText}`}
                  className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                >
                  수정됨
                </span>
              )}
            </div>
            {post.authorNickname && (
              <>
                <span className="text-slate-300">·</span>
                <span>by {post.authorNickname}</span>
              </>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 transition-all hover:shadow-sm active:scale-95 disabled:opacity-50 ${
                isLiked
                  ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
                  : 'border-red-200 bg-white text-red-600 hover:bg-red-50'
              }`}
            >
              <Heart
                className={`h-4 w-4 ${isLiking ? 'animate-pulse' : ''} ${isLiked ? 'fill-current' : ''}`}
              />
              <span className="font-medium">{likeCount}</span>
            </button>
            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-blue-600">
              <Eye className="h-4 w-4" />
              <span className="font-medium">{post.viewCount ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="게시글 삭제"
        description="정말 삭제할까요? 삭제한 글은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        onConfirm={doDelete}
        variant="destructive"
      />

      <ConfirmDialog
        open={showHardDeleteDialog}
        onOpenChange={setShowHardDeleteDialog}
        title="게시글 물리 삭제"
        description="정말 물리 삭제할까요? 삭제한 글은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        onConfirm={doHardDelete}
        variant="destructive"
      />
    </>
  );
}
