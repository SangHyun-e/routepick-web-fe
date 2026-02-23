import Link from 'next/link';
import UserStatusAction from '@/feature/admin/user/components/UserStatusAction';
import UserStatusBadge from '@/feature/admin/user/components/UserStatusBadge';
import type { AdminUserListItem, AdminUserStatus } from '@/feature/admin/user/types';

function formatDate(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

type Props = {
  users: AdminUserListItem[];
  actionId: number | null;
  onStatusChange: (userId: number, status: AdminUserStatus, reason?: string | null) => void;
};

export default function UserTable({ users, actionId, onStatusChange }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">사용자</th>
            <th className="px-4 py-3 text-left">이메일</th>
            <th className="px-4 py-3 text-left">역할</th>
            <th className="px-4 py-3 text-left">상태</th>
            <th className="px-4 py-3 text-left">가입일</th>
            <th className="px-4 py-3 text-left">액션</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">
                <Link href={`/admin/users/${user.id}`} className="hover:text-blue-600">
                  {user.nickname}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{user.email}</td>
              <td className="px-4 py-3 text-slate-600">{user.role}</td>
              <td className="px-4 py-3">
                <UserStatusBadge status={user.status} />
              </td>
              <td className="px-4 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
              <td className="px-4 py-3">
                <UserStatusAction
                  status={user.status}
                  disabled={actionId === user.id}
                  onChangeStatus={(status, reason) => onStatusChange(user.id, status, reason)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
