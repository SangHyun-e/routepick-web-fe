'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { fetchAdminDashboard } from '@/feature/admin/api';
import type { AdminDashboardResponse } from '@/feature/admin/dashboard/types';
import UserStatusBadge from '@/feature/admin/user/components/UserStatusBadge';

const NAV_ITEMS = [
  { label: '대시보드', href: '/admin' },
  { label: '회원 관리', href: '/admin/users' },
  { label: '게시글 관리', href: '/admin/posts' },
  { label: '댓글 관리', href: '/admin/comments' },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR');
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchAdminDashboard();
    if (res.ok) {
      setData(res.data);
    } else if (res.status === 401 || res.status === 403) {
      toast.error('관리자 권한이 필요합니다.');
      router.push('/login');
    } else {
      setData(null);
      setError(res.message ?? '관리자 대시보드를 불러오지 못했습니다.');
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const signupStats = useMemo(() => data?.signupsByDay ?? [], [data]);
  const totalSignups = useMemo(
    () => signupStats.reduce((sum, item) => sum + item.count, 0),
    [signupStats],
  );
  const maxSignupCount = useMemo(
    () => Math.max(1, ...signupStats.map((item) => item.count)),
    [signupStats],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3">
          <h1 className="text-2xl font-bold text-slate-900">관리자 대시보드</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:border-slate-300"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            {error}
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-400">총 가입자</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{data.totalUsers}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-400">최근 7일 가입</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{totalSignups}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-400">최근 가입자</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{data.recentUsers.length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">가입 추이 (7일)</h2>
                <button
                  type="button"
                  onClick={load}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  새로고침
                </button>
              </div>
              <div className="flex h-32 items-end gap-3">
                {signupStats.map((stat) => (
                  <div key={stat.date} className="flex flex-col items-center gap-2 text-xs">
                    <div
                      className="w-8 rounded-lg bg-slate-900/80"
                      style={{ height: `${(stat.count / maxSignupCount) * 100}%` }}
                    />
                    <span className="text-slate-500">{formatShortDate(stat.date)}</span>
                    <span className="text-slate-700">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">최근 가입 사용자</h2>
              {data.recentUsers.length === 0 ? (
                <p className="text-sm text-slate-500">최근 가입자가 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                        <th className="py-2 pr-3">닉네임</th>
                        <th className="py-2 pr-3">이메일</th>
                        <th className="py-2 pr-3">상태</th>
                        <th className="py-2 pr-3">가입일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentUsers.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100">
                          <td className="py-2 pr-3 font-medium text-slate-900">{user.nickname}</td>
                          <td className="py-2 pr-3 text-slate-600">{user.email}</td>
                          <td className="py-2 pr-3">
                            <UserStatusBadge status={user.status} />
                          </td>
                          <td className="py-2 pr-3 text-slate-600">{formatDate(user.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
