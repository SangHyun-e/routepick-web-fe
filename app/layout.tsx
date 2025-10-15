// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script"; // <-- 추가
import "./globals.css";
import Providers from "./providers";
import { AuthProvider } from "@/context/AuthContext";
import localFont from "next/font/local";

const pretendard = localFont({
  src: [
    {
      path: "../public/PretendardVariable.woff2",
    },
  ],
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "KurlyKelly",
  description: "Feless proudly presents KurlyKelly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <Script
          src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${pretendard.className} antialiased`}>
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
