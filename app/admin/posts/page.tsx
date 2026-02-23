'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  activateAdminPost,
  fetchAdminPosts,
  hardDeleteAdminPost,
  hideAdminPost,
  updateAdminPostNotice,
} from '@/feature/admin/api';
import { deletePost } from '@/feature/post/api';
import type { PaginatedResponse, PostListItemResponse } from '@/feature/post/types';
import Pagination from '@/feature/post/list/Pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const STATUS_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'HIDDEN', label: '비활성' },
  { value: 'DELETED', label: '삭제' },
];

export default function AdminPostsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState<PaginatedResponse<PostListItemResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [actionId, setActionId] = useState<number | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<PostListItemResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchAdminPosts(page, 20, statusFilter, keyword.trim() || undefined);
    if (res.ok) {
      setData(res.data);
    } else if (res.status === 401 || res.status === 403) {
      toast.error('관리자 권한이 필요합니다.');
      router.push('/login');
    } else {
      toast.error(res.message);
      setData(null);
    }
    setLoading(false);
  }, [keyword, page, router, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = useCallback(
    async (
      postId: number,
      action: 'activate' | 'hide' | 'delete' | 'hard-delete' | 'notice-on' | 'notice-off',
    ) => {
      setActionId(postId);
      let res;

      if (action === 'activate') res = await activateAdminPost(postId);
      else if (action === 'hide') res = await hideAdminPost(postId);
      else if (action === 'hard-delete') res = await hardDeleteAdminPost(postId);
      else if (action === 'notice-on') res = await updateAdminPostNotice(postId, true);
      else if (action === 'notice-off') res = await updateAdminPostNotice(postId, false);
      else res = await deletePost(postId);

      setActionId(null);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          toast.error('관리자 권한이 필요합니다.');
          router.push('/login');
          return;
        }
        toast.error(res.message ?? '요청에 실패했습니다.');
        return;
      }
      toast.success(
        action === 'hard-delete'
          ? '게시글이 삭제되었습니다.'
          : action === 'notice-on'
            ? '공지사항으로 등록했습니다.'
            : action === 'notice-off'
              ? '공지사항을 해제했습니다.'
              : '상태가 업데이트되었습니다.',
      );
      load();
    },
    [load, router],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">게시글 관리</h1>
          <p className="text-sm text-slate-500">활성/비활성/삭제 상태를 관리합니다.</p>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(0);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="제목/내용 키워드 검색"
              className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            />
          </div>
          <button
            onClick={() => {
              setPage(0);
              load();
            }}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            검색
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : !data ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            데이터를 불러오지 못했습니다.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {data.content.map((post) => (
                <div key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {post.isNotice && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            공지
                          </span>
                        )}
                        <Link
                          href={`/posts/${post.id}`}
                          className="text-sm font-semibold text-slate-900 transition hover:text-blue-600"
                        >
                          {post.title}
                        </Link>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        작성자: {post.authorNickname ?? '익명'} · 상태: {post.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAction(post.id, 'activate')}
                        disabled={actionId === post.id}
                        className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        활성화
                      </button>
                      <button
                        onClick={() => handleAction(post.id, 'hide')}
                        disabled={actionId === post.id}
                        className="rounded-md border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                      >
                        비활성화
                      </button>
                      <button
                        onClick={() => handleAction(post.id, 'delete')}
                        disabled={actionId === post.id}
                        className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        삭제
                      </button>
                      {post.isNotice ? (
                        <button
                          onClick={() => handleAction(post.id, 'notice-off')}
                          disabled={actionId === post.id}
                          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                        >
                          공지 해제
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(post.id, 'notice-on')}
                          disabled={actionId === post.id}
                          className="rounded-md border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                        >
                          공지 등록
                        </button>
                      )}
                      <button
                        onClick={() => setHardDeleteTarget(post)}
                        disabled={actionId === post.id}
                        className="rounded-md border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        물리삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={data.totalPages}
                onPageChange={(next) => setPage(next)}
              />
            </div>
          </>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(hardDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) setHardDeleteTarget(null);
        }}
        title="게시글 물리 삭제"
        description={
          <>
            정말 물리 삭제하시겠습니까? 삭제된 게시글과 댓글은 복구할 수 없습니다.
            {hardDeleteTarget && (
              <span className="mt-2 block text-xs text-slate-500">
                대상: {hardDeleteTarget.title}
              </span>
            )}
          </>
        }
        confirmText="삭제"
        cancelText="취소"
        variant="destructive"
        onConfirm={() => {
          if (!hardDeleteTarget) return;
          const targetId = hardDeleteTarget.id;
          setHardDeleteTarget(null);
          void handleAction(targetId, 'hard-delete');
        }}
      />
    </div>
  );
}
