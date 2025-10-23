# API 라우터 파일 생성 가이드

## 파일 위치
```
packages/api/src/routers/
├── question.ts
├── progress.ts
├── stats.ts
└── index.ts (이미 존재 - 수정)
```

---

## 1️⃣ packages/api/src/routers/question.ts

```typescript
import { z } from "zod";
import { publicProcedure, router } from "../index";
import { db } from "@my-better-t-app/db";
import { cards } from "@my-better-t-app/db";
import { eq } from "drizzle-orm";

const cardFilterSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const questionRouter = router({
  // 카드 목록 조회 (필터링)
  list: publicProcedure
    .input(cardFilterSchema)
    .query(async ({ input, ctx }) => {
      try {
        // 기본 쿼리
        let query = ctx.db.select().from(cards);

        // 카테고리 필터
        if (input.category) {
          query = query.where(eq(cards.category, input.category));
        }

        // 난이도 필터
        if (input.difficulty) {
          query = query.where(eq(cards.difficulty, input.difficulty));
        }

        // 전체 개수
        const allCards = await query;
        const total = allCards.length;

        // 페이지네이션 적용
        const data = allCards.slice(input.offset, input.offset + input.limit);

        return {
          data,
          total,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error("Error fetching cards:", error);
        return { data: [], total: 0, limit: input.limit, offset: input.offset };
      }
    }),

  // 개별 카드 조회
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      try {
        const card = await ctx.db
          .select()
          .from(cards)
          .where(eq(cards.id, input.id))
          .limit(1);

        if (!card.length) {
          throw new Error("Card not found");
        }

        return card[0];
      } catch (error) {
        console.error("Error fetching card:", error);
        throw error;
      }
    }),
});
```

---

## 2️⃣ packages/api/src/routers/progress.ts

```typescript
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { progress, cards } from "@my-better-t-app/db";
import { eq, and } from "drizzle-orm";

const progressRecordSchema = z.object({
  cardId: z.string().uuid(),
  isCorrect: z.boolean(),
});

const progressQuerySchema = z.object({
  cardId: z.string().uuid(),
});

export const progressRouter = router({
  // 풀이 기록 저장/업데이트
  record: protectedProcedure
    .input(progressRecordSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // 기존 기록 확인
        const existing = await ctx.db
          .select()
          .from(progress)
          .where(
            and(
              eq(progress.user_id, ctx.session.user.id),
              eq(progress.card_id, input.cardId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // 기존 기록 업데이트
          const updated = await ctx.db
            .update(progress)
            .set({
              is_correct: input.isCorrect,
              attempt_count: existing[0].attempt_count + 1,
              last_attempted_at: new Date(),
            })
            .where(eq(progress.id, existing[0].id))
            .returning();

          return updated[0];
        } else {
          // 새 기록 생성
          const newProgress = await ctx.db
            .insert(progress)
            .values({
              user_id: ctx.session.user.id,
              card_id: input.cardId,
              is_correct: input.isCorrect,
              attempt_count: 1,
            })
            .returning();

          return newProgress[0];
        }
      } catch (error) {
        console.error("Error recording progress:", error);
        throw error;
      }
    }),

  // 특정 카드의 진도 조회
  getByCard: protectedProcedure
    .input(progressQuerySchema)
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .select()
          .from(progress)
          .where(
            and(
              eq(progress.user_id, ctx.session.user.id),
              eq(progress.card_id, input.cardId)
            )
          )
          .limit(1);

        return result.length > 0 ? result[0] : null;
      } catch (error) {
        console.error("Error fetching progress:", error);
        return null;
      }
    }),
});
```

---

## 3️⃣ packages/api/src/routers/stats.ts

```typescript
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { progress, cards } from "@my-better-t-app/db";
import { eq } from "drizzle-orm";

const statsCategorySchema = z.object({
  category: z.string(),
});

export const statsRouter = router({
  // 전체 통계
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userProgress = await ctx.db
        .select()
        .from(progress)
        .where(eq(progress.user_id, ctx.session.user.id));

      const totalAttempts = userProgress.length;
      const correctCount = userProgress.filter((p) => p.is_correct).length;
      const accuracy = totalAttempts > 0 ? correctCount / totalAttempts : 0;

      return {
        totalAttempts,
        correctCount,
        accuracy,
        accuracy_percentage: Math.round(accuracy * 100),
      };
    } catch (error) {
      console.error("Error fetching stats summary:", error);
      return {
        totalAttempts: 0,
        correctCount: 0,
        accuracy: 0,
        accuracy_percentage: 0,
      };
    }
  }),

  // 카테고리별 통계
  getByCategory: protectedProcedure
    .input(statsCategorySchema)
    .query(async ({ ctx, input }) => {
      try {
        // 카테고리 카드 조회
        const categoryCards = await ctx.db
          .select()
          .from(cards)
          .where(eq(cards.category, input.category));

        const cardIds = categoryCards.map((c) => c.id);

        // 사용자의 모든 진도 조회
        const userProgress = await ctx.db
          .select()
          .from(progress)
          .where(eq(progress.user_id, ctx.session.user.id));

        // 해당 카테고리의 진도만 필터링
        const categoryProgress = userProgress.filter((p) =>
          cardIds.includes(p.card_id)
        );

        const correctCount = categoryProgress.filter((p) => p.is_correct).length;
        const accuracy =
          categoryProgress.length > 0 ? correctCount / categoryProgress.length : 0;

        return {
          category: input.category,
          totalCards: categoryCards.length,
          attempted: categoryProgress.length,
          correctCount,
          accuracy,
          accuracy_percentage: Math.round(accuracy * 100),
        };
      } catch (error) {
        console.error("Error fetching category stats:", error);
        return {
          category: input.category,
          totalCards: 0,
          attempted: 0,
          correctCount: 0,
          accuracy: 0,
          accuracy_percentage: 0,
        };
      }
    }),
});
```

---

## 4️⃣ packages/api/src/routers/index.ts (이미 준비됨)

확인 사항: 다음 내용이 포함되어 있는지 확인

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
      user: ctx.session.user,
    };
  }),

  // Main routers
  question: questionRouter,
  progress: progressRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
```

---

## 🔄 생성 후 실행 명령어

```bash
# Step 1: 위 3개 라우터 파일을 packages/api/src/routers/ 에 생성

# Step 2: routers/index.ts 확인

# Step 3: 타입 체크
bun check-types

# Step 4: 성공 시
bun dev
```

---

**상태**: 준비 완료 ✅  
**다음**: 실행 및 배포
