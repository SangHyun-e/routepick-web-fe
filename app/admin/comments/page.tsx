'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import type { AdminCommentListItem } from '@/feature/comment/types';
import type { PaginatedResponse } from '@/feature/post/types';
import Pagination from '@/feature/post/list/Pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  activateAdminComment,
  fetchAdminComments,
  hardDeleteAdminComment,
  hideAdminComment,
} from '@/feature/admin/api';

const STATUS_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'DELETED', label: '삭제' },
];

const DELETED_BY_LABEL: Record<string, string> = {
  USER: '작성자',
  ADMIN: '관리자',
};

function formatDate(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export default function AdminCommentsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState<PaginatedResponse<AdminCommentListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [actionId, setActionId] = useState<number | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<AdminCommentListItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchAdminComments(page, 20, statusFilter, keyword.trim() || undefined);
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
    async (commentId: number, action: 'activate' | 'hide' | 'hard-delete') => {
      setActionId(commentId);
      let res;

      if (action === 'activate') res = await activateAdminComment(commentId);
      else if (action === 'hide') res = await hideAdminComment(commentId);
      else res = await hardDeleteAdminComment(commentId);

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
        action === 'hard-delete' ? '댓글이 삭제되었습니다.' : '상태가 업데이트되었습니다.',
      );
      load();
    },
    [load, router],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">댓글 관리</h1>
          <p className="text-sm text-slate-500">댓글 상태를 관리합니다.</p>
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
              placeholder="댓글/게시글 키워드 검색"
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
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : !data ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            데이터를 불러오지 못했습니다.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {data.content.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/posts/${comment.postId}`}
                        className="block truncate text-sm font-semibold text-slate-900 transition hover:text-blue-600"
                      >
                        {comment.postTitle}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        작성자: {comment.authorNickname ?? '익명'} · 상태: {comment.status}
                        {comment.status === 'DELETED' && (
                          <span className="ml-2">
                            · 삭제 주체: {DELETED_BY_LABEL[comment.deletedBy] ?? comment.deletedBy}
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {comment.depth > 0 ? '답글' : '댓글'} · {formatDate(comment.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {comment.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleAction(comment.id, 'hide')}
                          disabled={actionId === comment.id}
                          className="rounded-md border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                        >
                          삭제
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(comment.id, 'activate')}
                          disabled={actionId === comment.id}
                          className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          복구
                        </button>
                      )}
                      <button
                        onClick={() => setHardDeleteTarget(comment)}
                        disabled={actionId === comment.id}
                        className="rounded-md border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        물리삭제
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {comment.content}
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
        title="댓글 물리 삭제"
        description="정말 물리 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다."
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
