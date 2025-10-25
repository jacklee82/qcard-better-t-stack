import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, userProgress, userStats } from "@my-better-t-app/db";
import { eq, and, sql } from "drizzle-orm";

export const progressRouter = router({
	// 특정 문제의 진행 상황 가져오기
	get: protectedProcedure
		.input(z.object({ questionId: z.string() }))
		.query(async ({ ctx, input }) => {
			const result = await db
				.select()
				.from(userProgress)
				.where(
					and(
						eq(userProgress.userId, ctx.session.user.id),
						eq(userProgress.questionId, input.questionId)
					)
				)
				.limit(1);
			return result[0] || null;
		}),

	// 전체 진행 상황 가져오기
	getAll: protectedProcedure.query(async ({ ctx }) => {
		return await db
			.select()
			.from(userProgress)
			.where(eq(userProgress.userId, ctx.session.user.id));
	}),

	// 답안 제출
	submit: protectedProcedure
		.input(
			z.object({
				questionId: z.string(),
				selectedAnswer: z.number(),
				isCorrect: z.boolean(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// 기존 진행 상황 확인
			const existing = await db
				.select()
				.from(userProgress)
				.where(
					and(
						eq(userProgress.userId, userId),
						eq(userProgress.questionId, input.questionId)
					)
				)
				.limit(1);

			if (existing.length > 0) {
				// 업데이트
				await db
					.update(userProgress)
					.set({
						isCorrect: input.isCorrect,
						selectedAnswer: input.selectedAnswer,
						attemptCount: existing[0].attemptCount + 1,
						lastAttemptedAt: new Date(),
					})
					.where(eq(userProgress.id, existing[0].id));
			} else {
				// 새로 생성
				await db.insert(userProgress).values({
					userId,
					questionId: input.questionId,
					isCorrect: input.isCorrect,
					selectedAnswer: input.selectedAnswer,
					attemptCount: 1,
					lastAttemptedAt: new Date(),
					createdAt: new Date(),
				});
			}

			// 사용자 통계 업데이트
			await updateUserStats(userId);

			// FIX-0019: isCorrect를 응답에 포함하여 클라이언트에서 활용
			return { 
				success: true,
				isCorrect: input.isCorrect,
				selectedAnswer: input.selectedAnswer
			};
		}),

	// 진행 상황 초기화
	reset: protectedProcedure
		.input(
			z.object({
				questionId: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			if (input.questionId) {
				// 특정 문제만 초기화
				await db
					.delete(userProgress)
					.where(
						and(
							eq(userProgress.userId, userId),
							eq(userProgress.questionId, input.questionId)
						)
					);
			} else {
				// 전체 초기화
				await db
					.delete(userProgress)
					.where(eq(userProgress.userId, userId));
			}

			// 통계 업데이트
			await updateUserStats(userId);

			return { success: true };
		}),

	// 틀린 문제 목록
	getIncorrect: protectedProcedure.query(async ({ ctx }) => {
		return await db
			.select()
			.from(userProgress)
			.where(
				and(
					eq(userProgress.userId, ctx.session.user.id),
					eq(userProgress.isCorrect, false)
				)
			);
	}),

	// 정답률
	getAccuracy: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const result = await db
			.select({
				total: sql<number>`count(*)`,
				correct: sql<number>`sum(case when ${userProgress.isCorrect} then 1 else 0 end)`,
			})
			.from(userProgress)
			.where(eq(userProgress.userId, userId));

		const total = result[0]?.total || 0;
		const correct = result[0]?.correct || 0;

		return {
			total,
			correct,
			accuracy: total > 0 ? (correct / total) * 100 : 0,
		};
	}),
});

// 사용자 통계 업데이트 헬퍼 함수
async function updateUserStats(userId: string) {
	// 전체 통계 계산
	const stats = await db
		.select({
			totalQuestions: sql<number>`count(distinct ${userProgress.questionId})`,
			correctAnswers: sql<number>`sum(case when ${userProgress.isCorrect} then 1 else 0 end)`,
			totalAttempts: sql<number>`sum(${userProgress.attemptCount})`,
		})
		.from(userProgress)
		.where(eq(userProgress.userId, userId));

	const {
		totalQuestions = 0,
		correctAnswers = 0,
		totalAttempts = 0,
	} = stats[0] || {};

	// userStats 테이블 업데이트 (upsert)
	const existing = await db
		.select()
		.from(userStats)
		.where(eq(userStats.userId, userId))
		.limit(1);

	if (existing.length > 0) {
		await db
			.update(userStats)
			.set({
				totalQuestions: Number(totalQuestions),
				correctAnswers: Number(correctAnswers),
				totalAttempts: Number(totalAttempts),
				lastStudiedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(userStats.userId, userId));
	} else {
		await db.insert(userStats).values({
			userId,
			totalQuestions: Number(totalQuestions),
			correctAnswers: Number(correctAnswers),
			totalAttempts: Number(totalAttempts),
			streak: 0,
			lastStudiedAt: new Date(),
			updatedAt: new Date(),
		});
	}
}




