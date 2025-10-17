export default function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width="32" height="32" viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <linearGradient id="rpGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <path
          d="M24 4c7.18 0 13 5.82 13 13 0 9.75-11.1 20.49-12.27 21.6a1.05 1.05 0 0 1-1.46 0C22.1 37.49 11 26.75 11 17c0-7.18 5.82-13 13-13z"
          fill="url(#rpGrad)"
        />
        <circle cx="24" cy="17" r="5" fill="white" />
        <rect x="22.6" y="26" width="2.8" height="8" rx="1.4" fill="white" opacity="0.9" />
      </svg>
      <span className="text-2xl font-bold tracking-tight">RoutePick</span>
    </div>
  );
}
