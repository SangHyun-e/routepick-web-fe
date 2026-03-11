import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from 'sonner';
import Header from '@/components/shared/SiteHeader';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

const SITE_URL = 'https://routepick.site';
const DEFAULT_TITLE = 'RoutePick | 드라이브 코스 공유 커뮤니티';
const DEFAULT_DESCRIPTION =
  '드라이브 코스를 공유하고 새로운 루트를 발견하는 커뮤니티 서비스 RoutePick';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: 'RoutePick',
    images: [
      {
        url: `${SITE_URL}/brand-logo.svg`,
        width: 1200,
        height: 630,
        alt: 'RoutePick',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [`${SITE_URL}/brand-logo.svg`],
  },
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
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>

        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
