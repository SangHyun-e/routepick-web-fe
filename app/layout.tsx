// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RoutePick',
  description: '커뮤니티 기반 드라이브/루트 추천 서비스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
