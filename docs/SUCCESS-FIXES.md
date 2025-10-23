# Qcard – Fix Recipes (Consolidated)

> 실제로 해결되어 재발 방지 가이드까지 정리된 성공 사례만 수록합니다.

---

### 인덱스
- [FIX-0001: Better Auth ↔ Drizzle 스키마 연결](#fix-0001)
- [FIX-0002: tRPC Context – NextRequest 타입 호환](#fix-0002)
- [FIX-0003: API 라우터 구조 + protected ctx.session](#fix-0003)
- [FIX-0004: DB Seed – dotenv 로드 순서](#fix-0004)
- [FIX-0005: React Syntax Highlighter – Prism → Light](#fix-0005)
- [FIX-0006: Loader default export/import 불일치](#fix-0006)
- [FIX-0007: tRPC Provider/Client 생성·순서 정정](#fix-0007)
- [FIX-0008: Sequential Study – undefined length 가드](#fix-0008)

---

<a id="fix-0001"></a>
## FIX-0001: Better Auth ↔ Drizzle 스키마 연결

- scope: `packages/auth`
- tags: [auth, drizzle, db]
- files: [`packages/auth/src/index.ts`]
- impact: data

### 문제
- Better Auth 테이블(users, sessions, accounts 등)이 자동 생성되지 않음

### 원인
- Drizzle 어댑터에 `schema` 미지정으로 스키마 인식 실패

### 해결
```typescript
import { expo } from '@better-auth/expo'
import { nextCookies } from 'better-auth/next-js'
import { betterAuth, type BetterAuthOptions } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@my-better-t-app/db'
import * as schema from '@my-better-t-app/db/schema/auth'

export const auth = betterAuth<BetterAuthOptions>({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  trustedOrigins: [process.env.CORS_ORIGIN || '', 'mybettertapp://', 'exp://'],
  emailAndPassword: { enabled: true },
  plugins: [nextCookies(), expo()],
})
```

### 검증
```bash
bun db:push
# ✓ Created table "sessions" / "accounts" / "verification_tokens" …
```

### 재발 방지
- Auth 어댑터 구성 시 `schema`를 항상 명시한다.

---

<a id="fix-0002"></a>
## FIX-0002: tRPC Context – NextRequest 타입 호환

- scope: `packages/api`
- tags: [trpc, nextjs]
- files: [`packages/api/src/context.ts`]
- impact: typecheck

### 문제
- tRPC context 타입 불일치로 Next.js API 라우트와 충돌

### 원인
- `Request`/임의 타입 사용으로 헤더 추출 타입 미스매치

### 해결
```typescript
import type { NextRequest } from 'next/server'
import { auth } from '@my-better-t-app/auth'
import { db } from '@my-better-t-app/db'

export async function createContext(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  return { session, db }
}

export type Context = Awaited<ReturnType<typeof createContext>>
```

### 검증
```bash
bun check-types
# ✓ 타입 체크 통과
```

### 재발 방지
- Next.js 14+ 핸들러에는 `NextRequest` 타입을 표준으로 사용한다.

---

<a id="fix-0003"></a>
## FIX-0003: API 라우터 구조 + protected ctx.session

- scope: `packages/api`
- tags: [trpc, auth]
- files: [`packages/api/src/routers/index.ts`]
- impact: api

### 문제
- 루트 라우터만 존재하고 보호 라우팅/세션 접근이 불명확

### 원인
- 보호 절차 미들웨어와 컨텍스트 계약이 정립되지 않음

### 해결
```typescript
import { protectedProcedure, publicProcedure, router } from '../index'
import { questionRouter } from './question'
import { progressRouter } from './progress'
import { statsRouter } from './stats'

export const appRouter = router({
  healthCheck: publicProcedure.query(() => 'OK'),
  privateData: protectedProcedure.query(({ ctx }) => ({
    message: 'This is private',
    user: ctx.session.user,
  })),
  question: questionRouter,
  progress: progressRouter,
  stats: statsRouter,
})

export type AppRouter = typeof appRouter
```

### 검증
- tRPC Devtools에서 `healthCheck`/`privateData` 정상 동작, 인증 없을 때 401

### 재발 방지
- 보호 라우트는 무조건 `protectedProcedure`를 사용하고 `ctx.session` 계약을 강제한다.

---

<a id="fix-0004"></a>
## FIX-0004: DB Seed – dotenv 로드 순서

- scope: `packages/db`
- tags: [db, dotenv, seed]
- files: [`packages/db/src/seed.ts`]
- impact: data, runtime

### 문제
- Seed 실행 시 인증 실패(`Authentication failed for user "postgres"`)

### 원인
- `dotenv.config()` 호출 이전에 DB 인스턴스 생성 및 연결 시도

### 해결
```typescript
import dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'

dotenv.config({ path: require('path').join(process.cwd(), '../../apps/web/.env') })

const db = drizzle(process.env.DATABASE_URL!)

async function seed() {
  // ...
}

seed()
```

### 검증
- Seed 실행 시 인증 에러 미발생, 삭제/삽입 쿼리 정상 수행

### 재발 방지
- 환경변수 의존 모듈은 반드시 `dotenv.config()` 이후 초기화한다.

---

<a id="fix-0005"></a>
## FIX-0005: React Syntax Highlighter – Prism → Light

- scope: `apps/web`
- tags: [react, nextjs, highlight]
- files: [`apps/web/src/components/question/code-block.tsx`]
- impact: build

### 문제
- 빌드 에러: `Module not found: Can't resolve 'refractor/lib/all'`

### 원인
- Prism 변형이 `refractor` 의존성을 요구하며 Turbopack과 충돌

### 해결
```tsx
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'

SyntaxHighlighter.registerLanguage('python', python)
```

### 검증
- 페이지에서 코드블록 정상 표시, 빌드 오류 해소

### 재발 방지
- Prism 대신 Light 사용, 필요한 언어만 명시 등록, hljs 스타일 활용

---

<a id="fix-0006"></a>
## FIX-0006: Loader default export/import 불일치

- scope: `apps/web`
- tags: [react]
- files: [`apps/web/src/components/loader.tsx`, `apps/web/src/app/study/sequential/page.tsx`]
- impact: runtime

### 문제
- `Export Loader doesn't exist in target module` 런타임 오류

### 원인
- `loader.tsx`는 default export인데, 사용부에서 named import 사용

### 해결
```tsx
// Before
// import { Loader } from '@/components/loader'

// After
import Loader from '@/components/loader'
```

### 검증
- 페이지 진입 시 컴포넌트 정상 렌더, 관련 오류 미발생

### 재발 방지
- default export 컴포넌트는 항상 default import로 불러온다.

---

<a id="fix-0007"></a>
## FIX-0007: tRPC Provider/Client 생성·순서 정정

- scope: `apps/web`
- tags: [trpc, react-query, nextjs]
- files: [`apps/web/src/utils/trpc.ts`, `apps/web/src/components/providers.tsx`, `apps/web/src/app/page.tsx`]
- impact: runtime

### 문제
- `contextMap[utilName] is not a function` / `hooks[lastArg] is not a function`

### 원인
- Provider 중첩/순서 오류, 전역 단일톤 클라이언트 생성으로 상태 꼬임

### 해결
```typescript
// utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@my-better-t-app/api/routers/index'
export const trpc = createTRPCReact<AppRouter>()
```

```tsx
// components/providers.tsx
"use client"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { httpBatchLink } from '@trpc/client'
import { trpc } from '@/utils/trpc'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
  }))

  const [trpcClient] = useState(() => trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        fetch(url, options) {
          return fetch(url, { ...options, credentials: 'include' })
        },
      }),
    ],
  }))

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools />
      </QueryClientProvider>
    </trpc.Provider>
  )
}
```

```tsx
// app/page.tsx
import { trpc } from '@/utils/trpc'
const healthCheck = trpc.healthCheck.useQuery()
```

### 검증
- 에러 재현 불가, hooks 정상 동작, Devtools에서 쿼리 관찰 가능

### 재발 방지
- tRPC 인스턴스만 모듈에서 export하고, 클라이언트/QueryClient는 Provider 내부에서 생성한다.

---

<a id="fix-0008"></a>
## FIX-0008: Sequential Study – undefined length 가드

- scope: `apps/web`
- tags: [trpc, nextjs]
- files: [`apps/web/src/app/study/sequential/page.tsx`]
- impact: runtime

### 문제
- 초기 렌더에서 `questions`가 `undefined`일 때 `.length` 접근으로 크래시

### 원인
- `trpc.question.getAll.useQuery()`의 `data` 초기값 미가드, non-null assertion 남용

### 해결
```tsx
const { data: questions = [], isLoading } = trpc.question.getAll.useQuery()
const currentQuestion = questions[currentIndex]
if (currentIndex < questions.length - 1) {
  // ...
}
```

### 검증
- 로딩 중 크래시 없음, 빈 상태 UI 정상, 이동/제출 흐름 정상

### 재발 방지
- 배열 응답은 `const { data = [] }` 패턴으로 기본값을 강제한다.

---

### 참고 및 규칙 요약
- Next.js 14+에서는 `NextRequest` 타입 표준화
- Auth-Drizzle 연동 시 `schema` 명시 필수
- tRPC 보호 라우트는 `protectedProcedure`로 통일하고 `ctx.session` 계약 보장
- 프론트 쿼리 데이터는 안전한 기본값과 가드로 접근
- Prism 대신 Light, 필요한 언어만 등록하여 빌드 안정성 확보

