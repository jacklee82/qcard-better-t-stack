import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, userStats, userProgress, questions } from "@my-better-t-app/db";
import { eq, and, sql, desc } from "drizzle-orm";

export const statsRouter = router({
	// 전체 통계 개요
	getOverview: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const stats = await db
			.select()
			.from(userStats)
			.where(eq(userStats.userId, userId))
			.limit(1);

		if (stats.length === 0) {
			return {
				totalQuestions: 0,
				correctAnswers: 0,
				totalAttempts: 0,
				accuracy: 0,
				streak: 0,
				lastStudiedAt: null,
			};
		}

		const stat = stats[0];
		const accuracy =
			stat.totalAttempts > 0
				? (stat.correctAnswers / stat.totalAttempts) * 100
				: 0;

		return {
			...stat,
			accuracy: Math.round(accuracy * 100) / 100,
		};
	}),

	// 카테고리별 통계
	getByCategory: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const result = await db
			.select({
				category: questions.category,
				total: sql<number>`count(*)`,
				correct: sql<number>`sum(case when ${userProgress.isCorrect} then 1 else 0 end)`,
				attempts: sql<number>`sum(${userProgress.attemptCount})`,
			})
			.from(userProgress)
			.innerJoin(questions, eq(userProgress.questionId, questions.id))
			.where(eq(userProgress.userId, userId))
			.groupBy(questions.category);

		return result.map((r) => ({
			category: r.category,
			total: Number(r.total),
			correct: Number(r.correct),
			attempts: Number(r.attempts),
			accuracy:
				Number(r.total) > 0
					? Math.round((Number(r.correct) / Number(r.total)) * 10000) / 100
					: 0,
		}));
	}),

	// 난이도별 통계
	getByDifficulty: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const result = await db
			.select({
				difficulty: questions.difficulty,
				total: sql<number>`count(*)`,
				correct: sql<number>`sum(case when ${userProgress.isCorrect} then 1 else 0 end)`,
				attempts: sql<number>`sum(${userProgress.attemptCount})`,
			})
			.from(userProgress)
			.innerJoin(questions, eq(userProgress.questionId, questions.id))
			.where(eq(userProgress.userId, userId))
			.groupBy(questions.difficulty);

		return result.map((r) => ({
			difficulty: r.difficulty,
			total: Number(r.total),
			correct: Number(r.correct),
			attempts: Number(r.attempts),
			accuracy:
				Number(r.total) > 0
					? Math.round((Number(r.correct) / Number(r.total)) * 10000) / 100
					: 0,
		}));
	}),

	// 연속 학습일 (스트릭)
	getStreak: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const stats = await db
			.select()
			.from(userStats)
			.where(eq(userStats.userId, userId))
			.limit(1);

		return {
			streak: stats[0]?.streak || 0,
			lastStudiedAt: stats[0]?.lastStudiedAt || null,
		};
	}),

	// 최근 활동
	getRecentActivity: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(50).default(10),
			})
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			const result = await db
				.select({
					questionId: userProgress.questionId,
					question: questions.question,
					category: questions.category,
					difficulty: questions.difficulty,
					isCorrect: userProgress.isCorrect,
					selectedAnswer: userProgress.selectedAnswer,
					correctAnswer: questions.correctAnswer,
					lastAttemptedAt: userProgress.lastAttemptedAt,
				})
				.from(userProgress)
				.innerJoin(questions, eq(userProgress.questionId, questions.id))
				.where(eq(userProgress.userId, userId))
				.orderBy(desc(userProgress.lastAttemptedAt))
				.limit(input.limit);

			return result;
		}),

	// 일별 학습 통계 (향후 확장)
	getDailyStats: protectedProcedure
		.input(
			z.object({
				days: z.number().min(1).max(90).default(7),
			})
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// 최근 N일간의 학습 데이터
			const result = await db
				.select({
					date: sql<string>`DATE(${userProgress.lastAttemptedAt})`,
					total: sql<number>`count(*)`,
					correct: sql<number>`sum(case when ${userProgress.isCorrect} then 1 else 0 end)`,
				})
				.from(userProgress)
				.where(
					and(
						eq(userProgress.userId, userId),
						sql`${userProgress.lastAttemptedAt} >= CURRENT_DATE - INTERVAL '${sql.raw(input.days.toString())} days'`
					)
				)
				.groupBy(sql`DATE(${userProgress.lastAttemptedAt})`)
				.orderBy(sql`DATE(${userProgress.lastAttemptedAt}) DESC`);

			return result.map((r) => ({
				date: r.date,
				total: Number(r.total),
				correct: Number(r.correct),
				accuracy:
					Number(r.total) > 0
						? Math.round((Number(r.correct) / Number(r.total)) * 10000) / 100
						: 0,
			}));
		}),
});

