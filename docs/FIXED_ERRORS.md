# 해결된 오류 목록

이 문서는 Qcard Better-T-Stack 프로젝트 개발 중 발생한 오류와 해결 방법을 정리합니다.

---

## 1. 데이터베이스 Seed 오류 - 환경변수 로딩 문제

### 오류 메시지
```
error: Failed query: delete from "questions" 
error: 인증에 실패했습니다 (Authentication failed for user "postgres")
Code: 28000
```

### 원인
- `seed.ts`에서 `db` import가 `dotenv.config()` 호출보다 먼저 실행됨
- 모듈 로딩 순서로 인해 환경변수가 로드되기 전에 DB 연결 시도

### 해결 방법

**`packages/db/src/seed.ts` 수정:**
```typescript
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { questions } from "./schema/questions";

// ✅ 환경변수를 가장 먼저 로드
dotenv.config({
	path: join(process.cwd(), "../../apps/web/.env"),
});

// ✅ db 연결을 환경변수 로드 후 생성
const db = drizzle(process.env.DATABASE_URL!);

async function seed() {
	console.log("🌱 Starting seed...");
	// ... 시드 로직
}

seed();
```

### 핵심 포인트
- ✅ `dotenv.config()` 가장 먼저 실행
- ✅ `db` 인스턴스를 환경변수 로드 후 생성
- ✅ `index.ts`의 export된 `db` 대신 로컬에서 직접 생성

---

## 2. React Syntax Highlighter - refractor 모듈 오류

### 오류 메시지
```
Module not found: Can't resolve 'refractor/lib/all'

./node_modules/react-syntax-highlighter/dist/esm/prism.js:3:1
Import traces:
  ./apps/web/src/components/question/code-block.tsx
```

### 원인
- `Prism` 버전의 `react-syntax-highlighter`가 `refractor/lib/all` 의존성 필요
- Next.js Turbopack과의 호환성 문제

### 해결 방법

**`apps/web/src/components/question/code-block.tsx` 수정:**

Before:
```typescript
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
```

After:
```typescript
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'

// ✅ Python 언어만 명시적으로 등록
SyntaxHighlighter.registerLanguage('python', python)
```

### 핵심 포인트
- ✅ `Prism` → `Light` 버전 사용 (가볍고 안정적)
- ✅ 필요한 언어만 명시적 등록
- ✅ hljs 스타일 사용 (`atomOneDark`)
- ✅ 의존성 문제 해결

---

## 3. Loader 컴포넌트 - Export 타입 오류

### 오류 메시지
```
Export Loader doesn't exist in target module

The export Loader was not found in module [project]/apps/web/src/components/loader.tsx
Did you mean to import default?
```

### 원인
- `loader.tsx`는 `default export`로 컴포넌트 내보냄
- 사용하는 곳에서 `named import`로 잘못 가져옴

### 해결 방법

**`apps/web/src/app/study/sequential/page.tsx` 수정:**

Before:
```typescript
import { Loader } from '@/components/loader'  // ❌
```

After:
```typescript
import Loader from '@/components/loader'  // ✅
```

### 핵심 포인트
- ✅ `default export` → `default import` 사용
- ✅ TypeScript의 export/import 규칙 준수

---

## 4. tRPC 설정 오류 - contextMap/hooks 함수 오류

### 오류 메시지
```
TypeError: contextMap[utilName] is not a function
TypeError: hooks[lastArg] is not a function
```

### 원인
1. tRPC Provider 순서가 잘못됨
2. QueryClient와 trpcClient를 전역에서 생성하여 상태 관리 문제 발생
3. tRPC 공식 문서의 권장 패턴을 따르지 않음

### 해결 방법

#### ✅ Step 1: `utils/trpc.ts` 단순화

Before:
```typescript
export const queryClient = new QueryClient({...})
export const trpcClient = trpc.createClient({...})
```

After:
```typescript
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@my-better-t-app/api/routers/index";

// ✅ tRPC 인스턴스만 export
export const trpc = createTRPCReact<AppRouter>();
```

#### ✅ Step 2: `components/providers.tsx` 수정

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "@/utils/trpc";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
	// ✅ 클라이언트들을 컴포넌트 내부에서 생성 (React 상태)
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000,
						retry: 1,
					},
				},
			}),
	);

	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: "/api/trpc",
					fetch(url, options) {
						return fetch(url, {
							...options,
							credentials: "include",
						});
					},
				}),
			],
		}),
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				{children}
				<ReactQueryDevtools />
			</QueryClientProvider>
		</trpc.Provider>
	);
}
```

#### ✅ Step 3: 홈 페이지 수정

**`apps/web/src/app/page.tsx`:**

Before:
```typescript
import { useQuery } from "@tanstack/react-query";
const healthCheck = useQuery(trpc.healthCheck.queryOptions());  // ❌
```

After:
```typescript
import { trpc } from "@/utils/trpc";
const healthCheck = trpc.healthCheck.useQuery();  // ✅
```

### 핵심 포인트
- ✅ `useState`로 클라이언트 생성 (컴포넌트 라이프사이클 관리)
- ✅ Provider 순서: `trpc.Provider` → `QueryClientProvider`
- ✅ tRPC hooks 직접 사용: `trpc.xxx.useQuery()`
- ✅ `queryOptions` 패턴 제거 (React Query v5 패턴과 혼동)

### tRPC 사용 패턴 정리

**✅ 올바른 사용법:**
```typescript
// Query
const data = trpc.procedure.useQuery(input)

// Mutation
const mutation = trpc.procedure.useMutation()

// Utils
const utils = trpc.useUtils()
```

**❌ 잘못된 사용법:**
```typescript
// queryOptions는 TanStack Query 직접 사용 시에만
const data = useQuery(trpc.procedure.queryOptions(input))
```

---

## 5. 필수 패키지 설치

### 추가 설치된 패키지
```bash
# tRPC React Query 통합
bun add @trpc/react-query

# 코드 하이라이팅
bun add react-syntax-highlighter @types/react-syntax-highlighter

# 차트 라이브러리
bun add recharts
```

---

## 참고 자료

- [tRPC 공식 문서 - React Setup](https://trpc.io/docs/client/react/setup)
- [tRPC 공식 문서 - useQuery](https://trpc.io/docs/client/react/useQuery)
- [React Syntax Highlighter - Light Mode](https://github.com/react-syntax-highlighter/react-syntax-highlighter)

---

## 요약

| 오류 | 원인 | 해결 |
|------|------|------|
| Seed 인증 실패 | 환경변수 로딩 순서 | dotenv를 가장 먼저 로드 |
| refractor 모듈 없음 | Prism 버전 의존성 | Light 버전으로 변경 |
| Loader export 없음 | import 타입 불일치 | default import 사용 |
| tRPC contextMap 오류 | Provider 구조 잘못됨 | 공식 패턴으로 전면 수정 |

---

**마지막 업데이트:** 2025-10-23



