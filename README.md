# RoutePick Web FE 🚦

커뮤니티 기반 **드라이브/루트 추천** 프론트엔드(웹) 애플리케이션.

> Next.js (App Router), TypeScript, React, shadcn/ui, pnpm

---

## ⚙️ 기술 스택

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI**: shadcn/ui
- **데이터**: (계획) TanStack Query(react-query) + Fetch(Axios 대체 가능)
- **폼/검증**: (계획) react-hook-form + zod
- **상태**: (계획) 전역 최소화, 서버 캐싱 중심(TanStack Query)
- **빌드/패키지**: pnpm, Node.js 20+
- **테스트**: (계획) Vitest + Testing Library + Playwright(E2E)
- **품질**: ESLint, Prettier, TypeCheck(tsc)
- **CI**: GitHub Actions (lint / type-check / build)

> 이후 계획: 접근성 점검, 이미지 최적화(Next Image), 에러 경계, Sentry 연동, PWA 옵션, i18n

---

## 🧱 아키텍처 & 디렉터리

**기본 원칙**: 기능(도메인) 모듈화 + 서버 캐싱 우선(요청 최소화)

```text
routepick-web-fe/
├─ app/                 ─ 라우팅(Next App Router)
│  ├─ (public)/...      ─ 공개 페이지 그룹
│  ├─ (auth)/...        ─ 로그인/회원 관련 그룹
│  ├─ posts/            ─ 게시글 목록/상세/작성
│  └─ layout.tsx        ─ 루트 레이아웃
├─ features/            ─ 도메인별 UI + 훅 + 서비스
│  ├─ auth/
│  └─ posts/
├─ components/          ─ 재사용 UI 컴포넌트
├─ lib/                 ─ util, fetcher, configs
├─ styles/              ─ 글로벌 스타일(Tailwind)
├─ public/              ─ 정적 자원
└─ types/               ─ 공용 타입 정의
```

---

## 🔐 환경 변수

- `SERVER_BASE_URL`: 서버 측에서 사용할 백엔드 베이스 URL
- `NEXT_PUBLIC_SERVER_BASE_URL`: 브라우저(EventSource 등)에서 사용할 백엔드 베이스 URL
- `NEXT_PUBLIC_SITE_URL`: SSR 절대 URL 생성용 사이트 URL
- `SITE_URL`: SSR 절대 URL 생성용 사이트 URL(서버 전용)

### 🚀 배포 예시 (routepick.site)

```
SERVER_BASE_URL=https://api.routepick.site
NEXT_PUBLIC_SERVER_BASE_URL=https://api.routepick.site
NEXT_PUBLIC_SITE_URL=https://routepick.site
SITE_URL=https://routepick.site
```

### 🔧 개발 예시

```
SERVER_BASE_URL=http://localhost:8080
NEXT_PUBLIC_SERVER_BASE_URL=http://localhost:8080
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
```

## 🔀 브랜치 전략 & 커밋 컨벤션

- 브랜치: main(배포), dev(통합), feature/\*
- 흐름: feature → dev → main
- 커밋: feat|fix|chore|docs|refactor|test: 메시지

---

## 📄 라이선스

**TBD**
