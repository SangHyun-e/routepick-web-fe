import type { ReactNode } from 'react';

export default function MyPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.08),transparent_50%)]" />
      <div className="relative mx-auto w-full max-w-4xl">
        <div className="border-border/50 rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
