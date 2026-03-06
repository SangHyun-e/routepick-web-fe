import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="text-muted-foreground mt-20 border-t py-6 text-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 md:flex-row">
        <div className="flex flex-col items-center gap-1 md:items-start">
          <p>© 2026 RoutePick</p>
          <p>Developed By Cheon SangHyun</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/terms" className="hover:text-foreground transition">
            이용약관
          </Link>
          <span aria-hidden="true">|</span>
          <Link href="/privacy" className="hover:text-foreground transition">
            개인정보처리방침
          </Link>
          <span aria-hidden="true">|</span>
          <Link href="/contact" className="hover:text-foreground transition">
            고객센터
          </Link>
        </div>
      </div>
    </footer>
  );
}
