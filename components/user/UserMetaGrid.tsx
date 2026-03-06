import { formatDateKST } from '@/lib/ui';
import type { Me } from '@/types/user';

export default function UserMetaGrid({ me }: { me: Me }) {
  const items = [
    { label: '이메일', value: me.email },
    { label: '닉네임', value: me.nickname || '-' },
    { label: '역할', value: me.role || '-' },
    { label: '상태', value: me.status || '-' },
    { label: '가입일', value: me.createdAt ? formatDateKST(me.createdAt) : '-' },
    { label: '최근 업데이트', value: me.updatedAt ? formatDateKST(me.updatedAt) : '-' },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">계정 정보</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <span className="text-sm font-medium text-slate-600">{it.label}</span>
            <span className="max-w-[60%] truncate text-right text-sm font-semibold text-slate-900">
              {it.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
