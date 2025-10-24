import { z } from 'zod'
import { protectedProcedure, router } from '../index'
import { db, goals, userStats } from '@my-better-t-app/db'
import { eq } from 'drizzle-orm'

export const goalRouter = router({
  // 목표 설정
  set: protectedProcedure
    .input(
      z.object({
        targetAccuracy: z.number().min(0).max(1).optional(), // 0.0 ~ 1.0
        dailyQuestionTarget: z.number().min(1).max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // 기존 목표가 있는지 확인
      const existing = await db
        .select()
        .from(goals)
        .where(eq(goals.userId, userId))
        .limit(1)

      if (existing.length > 0) {
        // 업데이트
        const updated = await db
          .update(goals)
          .set({
            targetAccuracy: input.targetAccuracy ?? existing[0].targetAccuracy,
            dailyQuestionTarget: input.dailyQuestionTarget ?? existing[0].dailyQuestionTarget,
            updatedAt: new Date(),
          })
          .where(eq(goals.userId, userId))
          .returning()

        return updated[0]
      } else {
        // 신규 생성
        const newGoal = await db
          .insert(goals)
          .values({
            userId,
            targetAccuracy: input.targetAccuracy,
            dailyQuestionTarget: input.dailyQuestionTarget,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()

        return newGoal[0]
      }
    }),

  // 현재 목표 조회
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const result = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .limit(1)

    return result[0] || null
  }),

  // 목표 대비 진행률
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // 목표 가져오기
    const goalResult = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .limit(1)

    if (goalResult.length === 0) {
      return {
        hasGoal: false,
        targetAccuracy: null,
        dailyQuestionTarget: null,
        currentAccuracy: null,
        dailyQuestionsCompleted: null,
        accuracyProgress: null,
        dailyProgress: null,
      }
    }

    const goal = goalResult[0]

    // 통계 가져오기
    const statsResult = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1)

    const stats = statsResult[0]
    const currentAccuracy = stats ? stats.accuracy : 0

    // 오늘 푼 문제 수 계산 (lastStudiedAt이 오늘인 경우)
    const today = new Date()
    const lastStudied = stats?.lastStudiedAt
    const isToday =
      lastStudied &&
      lastStudied.getDate() === today.getDate() &&
      lastStudied.getMonth() === today.getMonth() &&
      lastStudied.getFullYear() === today.getFullYear()

    // 임시로 totalQuestionsAnswered 사용 (실제로는 오늘 푼 문제 수를 별도 테이블에서 가져와야 함)
    const dailyQuestionsCompleted = isToday ? Math.min(stats?.totalQuestionsAnswered || 0, goal.dailyQuestionTarget || 0) : 0

    return {
      hasGoal: true,
      targetAccuracy: goal.targetAccuracy,
      dailyQuestionTarget: goal.dailyQuestionTarget,
      currentAccuracy,
      dailyQuestionsCompleted,
      accuracyProgress: goal.targetAccuracy ? (currentAccuracy / goal.targetAccuracy) * 100 : null,
      dailyProgress: goal.dailyQuestionTarget ? (dailyQuestionsCompleted / goal.dailyQuestionTarget) * 100 : null,
    }
  }),

  // 목표 삭제
  delete: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id

    await db.delete(goals).where(eq(goals.userId, userId))

    return { success: true }
  }),
})
