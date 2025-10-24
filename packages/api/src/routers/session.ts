import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, studySessions, userStats } from "@my-better-t-app/db";
import { eq, and, desc, sql } from "drizzle-orm";

export const sessionRouter = router({
	// 세션 시작 (FIX-0003: protectedProcedure)
	start: protectedProcedure
		.input(
			z.object({
				mode: z.enum(["sequential", "random", "category", "review"]),
				categoryFilter: z.string().optional(),
				difficultyFilter: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// 새 세션 생성
			const result = await db
				.insert(studySessions)
				.values({
					userId,
					mode: input.mode,
					categoryFilter: input.categoryFilter,
					difficultyFilter: input.difficultyFilter,
					questionsCompleted: 0,
					correctAnswers: 0,
					startedAt: new Date(),
				})
				.returning();

			return {
				sessionId: result[0].id,
				startedAt: result[0].startedAt,
			};
		}),

	// 세션 종료
	end: protectedProcedure
		.input(
			z.object({
				sessionId: z.number(),
				questionsCompleted: z.number(),
				correctAnswers: z.number(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// 세션 업데이트
			await db
				.update(studySessions)
				.set({
					questionsCompleted: input.questionsCompleted,
					correctAnswers: input.correctAnswers,
					completedAt: new Date(),
				})
				.where(
					and(
						eq(studySessions.id, input.sessionId),
						eq(studySessions.userId, userId)
					)
				);

			// Streak 업데이트
			await updateStreak(userId);

			return { success: true };
		}),

	// 현재 활성 세션 조회
	getCurrent: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		// completedAt이 null인 세션 찾기
		const result = await db
			.select()
			.from(studySessions)
			.where(
				and(
					eq(studySessions.userId, userId),
					sql`${studySessions.completedAt} IS NULL`
				)
			)
			.orderBy(desc(studySessions.startedAt))
			.limit(1);

		return result[0] || null;
	}),

	// 최근 세션 목록
	getRecent: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(50).default(10),
			})
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			return await db
				.select()
				.from(studySessions)
				.where(eq(studySessions.userId, userId))
				.orderBy(desc(studySessions.startedAt))
				.limit(input.limit);
		}),

	// 세션 통계
	getStats: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const result = await db
			.select({
				totalSessions: sql<number>`count(*)`,
				completedSessions: sql<number>`count(*) filter (where ${studySessions.completedAt} is not null)`,
				totalQuestions: sql<number>`sum(${studySessions.questionsCompleted})`,
				totalCorrect: sql<number>`sum(${studySessions.correctAnswers})`,
				avgAccuracy: sql<number>`
					case 
						when sum(${studySessions.questionsCompleted}) > 0 
						then (sum(${studySessions.correctAnswers})::float / sum(${studySessions.questionsCompleted})::float) * 100
						else 0 
					end
				`,
			})
			.from(studySessions)
			.where(eq(studySessions.userId, userId));

		const stats = result[0];

		return {
			totalSessions: Number(stats.totalSessions) || 0,
			completedSessions: Number(stats.completedSessions) || 0,
			totalQuestions: Number(stats.totalQuestions) || 0,
			totalCorrect: Number(stats.totalCorrect) || 0,
			avgAccuracy: Math.round((Number(stats.avgAccuracy) || 0) * 100) / 100,
		};
	}),
});

// Streak 업데이트 헬퍼 함수
async function updateStreak(userId: string) {
	const stats = await db
		.select()
		.from(userStats)
		.where(eq(userStats.userId, userId))
		.limit(1);

	const today = new Date();
	today.setHours(0, 0, 0, 0); // 시간 초기화

	if (stats.length === 0) {
		// 첫 학습 - userStats 생성
		await db.insert(userStats).values({
			userId,
			totalQuestions: 0,
			correctAnswers: 0,
			totalAttempts: 0,
			streak: 1,
			lastStudiedAt: new Date(),
			updatedAt: new Date(),
		});
		return;
	}

	const lastStudied = stats[0].lastStudiedAt;
	if (!lastStudied) {
		// lastStudiedAt이 없으면 첫 학습
		await db
			.update(userStats)
			.set({
				streak: 1,
				lastStudiedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(userStats.userId, userId));
		return;
	}

	// 날짜 차이 계산
	const lastStudiedDate = new Date(lastStudied);
	lastStudiedDate.setHours(0, 0, 0, 0);

	const daysDiff = Math.floor(
		(today.getTime() - lastStudiedDate.getTime()) / (1000 * 60 * 60 * 24)
	);

	if (daysDiff === 0) {
		// 오늘 이미 학습함 - streak 유지, lastStudiedAt만 업데이트
		await db
			.update(userStats)
			.set({
				lastStudiedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(userStats.userId, userId));
	} else if (daysDiff === 1) {
		// 어제 학습했음 - streak 증가
		await db
			.update(userStats)
			.set({
				streak: stats[0].streak + 1,
				lastStudiedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(userStats.userId, userId));
	} else {
		// 연속 끊김 - streak 리셋
		await db
			.update(userStats)
			.set({
				streak: 1,
				lastStudiedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(userStats.userId, userId));
	}
}

