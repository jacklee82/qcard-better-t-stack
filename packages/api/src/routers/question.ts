import { z } from "zod";
import { publicProcedure, router } from "../index";
import { db, questions } from "@my-better-t-app/db";
import { eq, sql, and, inArray } from "drizzle-orm";

export const questionRouter = router({
	// 모든 문제 가져오기
	getAll: publicProcedure.query(async () => {
		return await db.select().from(questions);
	}),

	// 특정 문제 가져오기
	getById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			const result = await db
				.select()
				.from(questions)
				.where(eq(questions.id, input.id))
				.limit(1);
			return result[0] || null;
		}),

	// 랜덤 문제 가져오기
	getRandom: publicProcedure
		.input(
			z.object({
				count: z.number().min(1).max(50).default(10),
				category: z.string().optional(),
				difficulty: z.string().optional(),
			})
		)
		.query(async ({ input }) => {
			let query = db.select().from(questions);

			// 필터 적용
			const conditions = [];
			if (input.category) {
				conditions.push(eq(questions.category, input.category));
			}
			if (input.difficulty) {
				conditions.push(eq(questions.difficulty, input.difficulty));
			}

			if (conditions.length > 0) {
				query = query.where(and(...conditions)) as any;
			}

			// 랜덤 정렬 및 제한
			const result = await query.orderBy(sql`RANDOM()`).limit(input.count);
			return result;
		}),

	// 카테고리별 문제 가져오기
	getByCategory: publicProcedure
		.input(z.object({ category: z.string() }))
		.query(async ({ input }) => {
			return await db
				.select()
				.from(questions)
				.where(eq(questions.category, input.category));
		}),

	// 난이도별 문제 가져오기
	getByDifficulty: publicProcedure
		.input(z.object({ difficulty: z.string() }))
		.query(async ({ input }) => {
			return await db
				.select()
				.from(questions)
				.where(eq(questions.difficulty, input.difficulty));
		}),

	// 여러 문제 ID로 가져오기 (복습용)
	getByIds: publicProcedure
		.input(z.object({ ids: z.array(z.string()) }))
		.query(async ({ input }) => {
			if (input.ids.length === 0) return [];
			return await db
				.select()
				.from(questions)
				.where(inArray(questions.id, input.ids));
		}),

	// 카테고리 목록 가져오기
	getCategories: publicProcedure.query(async () => {
		const result = await db
			.selectDistinct({ category: questions.category })
			.from(questions);
		return result.map((r) => r.category);
	}),

	// 난이도 목록 가져오기
	getDifficulties: publicProcedure.query(async () => {
		const result = await db
			.selectDistinct({ difficulty: questions.difficulty })
			.from(questions);
		return result.map((r) => r.difficulty);
	}),

	// 전체 문제 개수
	getCount: publicProcedure
		.input(
			z
				.object({
					category: z.string().optional(),
					difficulty: z.string().optional(),
				})
				.optional()
		)
		.query(async ({ input }) => {
			const conditions = [];
			if (input?.category) {
				conditions.push(eq(questions.category, input.category));
			}
			if (input?.difficulty) {
				conditions.push(eq(questions.difficulty, input.difficulty));
			}

			let query = db
				.select({ count: sql<number>`count(*)` })
				.from(questions);

			if (conditions.length > 0) {
				query = query.where(and(...conditions)) as any;
			}

			const result = await query;
			return result[0]?.count || 0;
		}),
});




