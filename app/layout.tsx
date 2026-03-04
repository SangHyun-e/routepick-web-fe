import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from 'sonner';
import SiteHeader from '@/components/shared/SiteHeader';
import SiteFooter from '@/components/shared/SiteFooter';
import DriveWeatherBanner from '@/components/shared/DriveWeatherBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RoutePick',
  description: '커뮤니티 기반 드라이브/루트 추천 서비스',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full ${inter.className}`}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <DriveWeatherBanner />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </AuthProvider>

        <Toaster />
      </body>
    </html>
  );
}
