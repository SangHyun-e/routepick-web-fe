'use client';

import { useState } from 'react';
import { ArrowLeft, MapPin, Clock, Heart, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PostResponse } from '@/feature/post/types';
import { Button } from '@/components/ui/button';
import { usePostActions } from '@/feature/post/hooks/usePostActions';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { likePost } from '@/feature/post/api';

interface PostDetailHeaderProps {
  post: PostResponse;
  isOwner: boolean;
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

export default function PostDetailHeader({ post, isOwner }: PostDetailHeaderProps) {
  const router = useRouter();
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser ?? false);
  const [isLiking, setIsLiking] = useState(false);
  const { goEdit, confirmDelete, doDelete, showDeleteDialog, setShowDeleteDialog } = usePostActions(
    {
      postId: post.id,
    },
  );

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

            {isOwner && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={goEdit}>
                  수정
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  삭제
                </Button>
              </div>
            )}
          </div>
          <h1 className="mb-4 text-3xl font-bold text-balance text-slate-900">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            {post.region && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{post.region}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>{formatDate(post.createdAt)}</span>
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
    </>
  );
}
