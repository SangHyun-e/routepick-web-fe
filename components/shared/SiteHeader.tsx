import Link from 'next/link';
import { cookies } from 'next/headers';
import BrandLogo from '@/components/shared/BrandLogo';
import LogoutButton from '@/components/user/LogoutButton';

export default function SiteHeader() {
  const cookieStore = cookies();
  const hasAccessToken = Boolean(cookieStore.get('rp_at')?.value);
  const hasRefreshToken = Boolean(cookieStore.get('RP_REFRESH')?.value);
  const isAuthed = hasAccessToken || hasRefreshToken;

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 lg:px-6">
        <BrandLogo className="text-slate-900" />

        <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
          <Link
            href="/"
            className="transition hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            홈
          </Link>
          <Link
            href="/posts"
            className="transition hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            커뮤니티
          </Link>
          <Link
            href="/me"
            className="transition hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            마이페이지
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthed ? (
            <>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
