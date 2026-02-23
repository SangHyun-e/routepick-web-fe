import type { AdminUserStatus } from '@/feature/admin/user/types';

const STATUS_STYLE: Record<AdminUserStatus, string> = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  BLOCKED: 'border-amber-200 bg-amber-50 text-amber-700',
  DELETED: 'border-slate-200 bg-slate-50 text-slate-600',
  PENDING: 'border-blue-200 bg-blue-50 text-blue-700',
};

const STATUS_LABEL: Record<AdminUserStatus, string> = {
  ACTIVE: '활성',
  BLOCKED: '정지',
  DELETED: '탈퇴',
  PENDING: '대기',
};

export default function UserStatusBadge({ status }: { status: AdminUserStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
