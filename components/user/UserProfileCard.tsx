import type { Me } from '@/types/user';
import { initialsFrom } from '@/lib/ui';

export default function UserProfileCard({ me }: { me: Me }) {
  const name = me.nickname || me.email?.split('@')[0] || '사용자';

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-24 bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600" />
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {me.avatarUrl ? (
            <img
              src={me.avatarUrl || '/placeholder.svg'}
              alt={name}
              className="-mt-12 size-20 rounded-full border-4 border-white object-cover shadow-lg"
            />
          ) : (
            <div className="-mt-12 flex size-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
              <span className="text-2xl font-bold">{initialsFrom(name)}</span>
            </div>
          )}
          <div className="mt-2 flex-1">
            <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
            <p className="text-sm text-slate-600">{me.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {me.role && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  {me.role}
                </span>
              )}
              {me.status && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  {me.status}
                </span>
              )}
            </div>
          </div>
        </div>
        {me.bio && (
          <p className="mt-6 text-sm leading-relaxed whitespace-pre-line text-slate-600">
            {me.bio}
          </p>
        )}
      </div>
    </section>
  );
}
