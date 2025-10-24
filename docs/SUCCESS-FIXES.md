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
- [FIX-0009: Dashboard – lucide 아이콘 미수입(Flame/Clock)](#fix-0009)
- [FIX-0010: SessionTimer – Date 직렬화 문자열 처리](#fix-0010)

---

<a id="fix-0010"></a>
## FIX-0010: SessionTimer – Date 직렬화 문자열 처리

- scope: `apps/web`
- tags: [react, nextjs, trpc]
- files: [`apps/web/src/components/study/session-timer.tsx`]
- impact: runtime

### 문제
- 런타임 오류: `TypeError: startTime.getTime is not a function`

### 원인
- API에서 반환된 `startedAt`이 문자열로 직렬화되어 전달되는데, `SessionTimer`가 `Date`만 가정하고 `getTime()`을 호출함

### 해결
```tsx
// Before
interface SessionTimerProps {
  startTime: Date
}
useEffect(() => {
  const initialElapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
  // ...
}, [startTime])

// After
interface SessionTimerProps {
  startTime: Date | string | number
}
const toStartMs = (value: Date | string | number) => {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? Date.now() : parsed
}
useEffect(() => {
  const startMs = toStartMs(startTime)
  const tick = () => {
    const newElapsed = Math.floor((Date.now() - startMs) / 1000)
    setElapsed(newElapsed)
    onTimeUpdate?.(newElapsed)
  }
  tick()
  const interval = setInterval(tick, 1000)
  return () => clearInterval(interval)
}, [startTime, onTimeUpdate])
```

### 검증
- 학습 페이지(`sequential`, `random`, `review`) 진입 시 타이머 정상 시작/증가
- linter 경고/오류 없음

### 재발 방지

#### 1. **근본 원인 이해**
- **tRPC 기본 동작**: `superjson` 없이는 모든 `Date` 객체가 ISO 문자열로 직렬화됨
- **API 경계**: 서버↔클라이언트 간 데이터는 항상 JSON 직렬화/역직렬화 과정을 거침
- **타입 안전성의 한계**: TypeScript는 컴파일타임만 체크, 런타임 타입은 보장 안 함

#### 2. **필수 체크리스트 (API 응답에 Date가 포함될 때)**
- [ ] tRPC 응답에 `Date` 타입이 있는가?
- [ ] `superjson` transformer가 설정되어 있는가?
- [ ] 설정 안 되어 있다면, 컴포넌트에서 `Date | string | number`로 타입 정의했는가?
- [ ] 실제 브라우저에서 테스트했는가? (타입만 믿지 말 것)

#### 3. **해결 방법 (우선순위 순)**

**방법 A: tRPC에 superjson 추가 (권장)**
```typescript
// packages/api/src/index.ts
import superjson from 'superjson'
import { initTRPC } from '@trpc/server'

export const t = initTRPC.context<Context>().create({
  transformer: superjson  // Date 자동 직렬화/역직렬화
})
```

**방법 B: 컴포넌트에서 유연한 타입 처리**
```tsx
interface Props {
  startTime: Date | string | number  // ✅ 유니온 타입
}

const toTimestamp = (value: Date | string | number) => {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  return Date.parse(value)
}
```

**방법 C: 호출부에서 명시적 변환 (임시 방편)**
```tsx
<SessionTimer startTime={new Date(sessionData.startedAt)} />
```

#### 4. **테스트 규칙**
- 새로운 API 응답을 사용하는 컴포넌트는 **반드시 브라우저에서 실행 테스트**
- `console.log(typeof data)` 로 런타임 타입 확인
- Date, File, Blob 등 특수 객체는 직렬화 동작 재확인

---

<a id="fix-0009"></a>
## FIX-0009: Dashboard – lucide 아이콘 미수입(Flame/Clock)

- scope: `apps/web`
- tags: [react, nextjs, lucide-react]
- files: [`apps/web/src/app/dashboard/dashboard.tsx`]
- impact: runtime

### 문제
- 런타임 오류: `ReferenceError: Flame is not defined`

### 원인
- `dashboard.tsx`에서 `Flame`, `Clock` 아이콘을 사용했지만 `lucide-react`에서 import하지 않음

### 해결
```tsx
// Before
import { Target, BookOpen, TrendingUp } from 'lucide-react'

// After
import { Target, BookOpen, TrendingUp, Flame, Clock } from 'lucide-react'
```

### 검증
- 대시보드 페이지 렌더링 시 ReferenceError 미발생
- linter 경고/오류 없음

### 재발 방지
- UI에서 새로운 아이콘 사용 시, 대응하는 `lucide-react` named import를 반드시 추가한다.
- PR 리뷰 체크리스트에 "사용 아이콘 import 확인" 항목을 포함한다.

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

