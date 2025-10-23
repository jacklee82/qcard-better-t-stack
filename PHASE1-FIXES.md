# Phase 1 - 오류 수정 완료 목록

> 지금까지 작업하면서 **제대로 수정되어 작동하는 내용**만 정리

---

## ✅ 수정 완료사항

### 1. packages/api/src/context.ts - NextRequest 타입 수정

**문제**: tRPC context 타입이 맞지 않음  
**해결**: NextRequest 사용으로 표준화

```typescript
import type { NextRequest } from "next/server";
import { auth } from "@my-better-t-app/auth";
import { db } from "@my-better-t-app/db";

export async function createContext(req: NextRequest) {
	const session = await auth.api.getSession({
		headers: req.headers,
	});

	return {
		session,
		db,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

**왜 맞는가**: Next.js 14의 fetch 핸들러와 호환되는 표준 타입

---

### 2. packages/auth/src/index.ts - Better Auth Drizzle 스키마 설정

**문제**: Better Auth 테이블 자동 생성 미실패  
**해결**: Drizzle 스키마 명시적으로 연결

```typescript
import { expo } from '@better-auth/expo';
import { nextCookies } from 'better-auth/next-js';
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@my-better-t-app/db";
import * as schema from "@my-better-t-app/db/schema/auth";

export const auth = betterAuth<BetterAuthOptions>({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,  // ← 스키마 명시
	}),
	trustedOrigins: [
		process.env.CORS_ORIGIN || "", 
		"mybettertapp://", 
		"exp://",
	],
	emailAndPassword: {
		enabled: true,
	},
	plugins: [nextCookies(), expo()]
});
```

**왜 맞는가**: Better Auth가 자동으로 users, sessions, accounts 테이블 생성

---

### 3. packages/api/src/routers/index.ts - 라우터 구조 확장

**문제**: 기본 라우터만 존재  
**해결**: 필요한 라우터들 추가

```typescript
import { protectedProcedure, publicProcedure, router } from "../index";
import { questionRouter } from "./question";
import { progressRouter } from "./progress";
import { statsRouter } from "./stats";

export const appRouter = router({
	// Health check
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	
	// Test protected route
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,  // ← Session 객체 사용
		};
	}),

	// Main routers
	question: questionRouter,
	progress: progressRouter,
	stats: statsRouter,
});

export type AppRouter = typeof appRouter;
```

**왜 맞는가**: 
- 라우터 모듈식 구조로 유지보수 용이
- ctx.session.user로 직접 세션 정보 접근 가능
- Phase 2에서 필요한 라우터들을 준비

---

## 📋 다음 단계

### Phase 2 시작 전 필수 작업

1. **packages/api/src/routers/question.ts** 생성
   ```typescript
   import { router, publicProcedure } from "../index";
   
   export const questionRouter = router({
     list: publicProcedure.query(async () => {
       // all-questions.json 조회
     }),
   });
   ```

2. **packages/api/src/routers/progress.ts** 생성
   ```typescript
   import { router, protectedProcedure } from "../index";
   
   export const progressRouter = router({
     record: protectedProcedure.mutation(async ({ ctx, input }) => {
       // 학습 진도 저장
     }),
   });
   ```

3. **packages/api/src/routers/stats.ts** 생성
   ```typescript
   import { router, protectedProcedure } from "../index";
   
   export const statsRouter = router({
     getSummary: protectedProcedure.query(async ({ ctx }) => {
       // 통계 조회
     }),
   });
   ```

---

## 🔧 DB 스키마 재생성 계획

현재 삭제된 스키마 파일들을 다시 생성해야 합니다:

```bash
# Step 1: 스키마 파일 생성 (users, decks, cards, progress)
# packages/db/src/schema/*.ts

# Step 2: 마이그레이션 생성
bun db:generate

# Step 3: 적용
bun db:push
```

---

## ✨ Phase 1 상태

| 항목 | 상태 |
|------|------|
| Supabase 연결 | ✅ 완료 |
| Drizzle 설정 | ✅ 완료 |
| Better Auth 설정 | ✅ 완료 |
| tRPC Context | ✅ 수정됨 |
| 기본 라우터 | ✅ 구조 완성 |
| **DB 스키마** | ❌ 재생성 필요 |
| **타입 체크** | ⏳ 라우터 생성 후 |

---

## 🚀 다음 커맨드

```bash
# 1. 라우터 3개 파일 생성 (위의 템플릿 사용)
# 2. 타입 체크 실행
bun check-types

# 3. 성공 후 Phase 2로 진행
```

---

**마지막 업데이트**: Phase 1 마무리  
**다음 단계**: Phase 2 - 백엔드 API 개발
