import UserStatusBadge from '@/feature/admin/user/components/UserStatusBadge';
import type { AdminUserStatusHistoryItem } from '@/feature/admin/user/types';

function formatDateTime(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hh}:${mm}`;
}

type Props = {
  history: AdminUserStatusHistoryItem[];
  loading: boolean;
};

export default function UserStatusHistoryList({ history, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="h-14 rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        변경 이력이 없습니다.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {history.map((item) => (
        <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <UserStatusBadge status={item.fromStatus} />
              <span className="text-xs text-slate-400">→</span>
              <UserStatusBadge status={item.toStatus} />
              {item.reason && (
                <span className="text-xs text-slate-500">사유: {item.reason}</span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              {formatDateTime(item.createdAt)}
              {item.adminUserId && <span className="ml-2">관리자: {item.adminUserId}</span>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
