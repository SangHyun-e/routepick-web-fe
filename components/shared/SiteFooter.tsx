export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/70 text-sm text-slate-500 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 md:flex-row md:items-center md:justify-between lg:px-6">
        <p className="font-medium text-slate-600">© {year} RoutePick. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="mailto:support@routepick.app"
            className="transition hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            고객센터
          </a>
          <span aria-hidden="true" className="text-slate-300">
            |
          </span>
          <a
            href="/terms"
            className="transition hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            이용약관
          </a>
          <a
            href="/privacy"
            className="transition hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            개인정보처리방침
          </a>
        </div>
      </div>
    </footer>
  );
}
