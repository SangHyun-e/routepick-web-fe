import { Me } from '@/types/user';
import { initialsFrom } from '@/lib/ui';

export default function UserProfileCard({ me }: { me: Me }) {
  const name = me.nickname || me.email?.split('@')[0] || '사용자';

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="h-24 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100" />
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-4">
          {me.avatarUrl ? (
            <img
              src={me.avatarUrl}
              alt={name}
              className="-mt-12 size-20 rounded-full border-4 border-white object-cover shadow"
            />
          ) : (
            <div className="-mt-12 flex size-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow">
              <span className="text-2xl font-bold">{initialsFrom(name)}</span>
            </div>
          )}
          <div className="mt-2">
            <h2 className="text-xl leading-tight font-semibold">{name}</h2>
            <p className="text-muted-foreground text-sm">{me.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {me.role && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium">
                  역할: {me.role}
                </span>
              )}
              {me.status && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium">
                  상태: {me.status}
                </span>
              )}
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium">ID: {me.id}</span>
            </div>
          </div>
        </div>
        {me.bio && (
          <p className="text-muted-foreground mt-6 text-sm whitespace-pre-line">{me.bio}</p>
        )}
      </div>
    </section>
  );
}
