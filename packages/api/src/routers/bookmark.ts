import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { db, bookmarks, questions } from "@my-better-t-app/db";
import { eq, and } from "drizzle-orm";

export const bookmarkRouter = router({
	// 북마크 토글 (추가/삭제)
	toggle: protectedProcedure
		.input(
			z.object({
				questionId: z.string(),
				note: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// 기존 북마크 확인
			const existing = await db
				.select()
				.from(bookmarks)
				.where(
					and(
						eq(bookmarks.userId, userId),
						eq(bookmarks.questionId, input.questionId)
					)
				)
				.limit(1);

			if (existing.length > 0) {
				// 이미 북마크됨 → 삭제
				await db
					.delete(bookmarks)
					.where(eq(bookmarks.id, existing[0].id));
				return { action: "removed", isBookmarked: false };
			} else {
				// 북마크 추가
				await db.insert(bookmarks).values({
					userId,
					questionId: input.questionId,
					note: input.note,
					createdAt: new Date(),
				});
				return { action: "added", isBookmarked: true };
			}
		}),

	// 전체 북마크 목록
	getAll: protectedProcedure.query(async ({ ctx }) => {
		return await db
			.select()
			.from(bookmarks)
			.where(eq(bookmarks.userId, ctx.session.user.id))
			.orderBy(bookmarks.createdAt);
	}),

	// 특정 문제 북마크 여부 확인
	check: protectedProcedure
		.input(z.object({ questionId: z.string() }))
		.query(async ({ ctx, input }) => {
			const result = await db
				.select()
				.from(bookmarks)
				.where(
					and(
						eq(bookmarks.userId, ctx.session.user.id),
						eq(bookmarks.questionId, input.questionId)
					)
				)
				.limit(1);
			return result.length > 0;
		}),

	// 북마크된 문제 데이터 가져오기
	getBookmarkedQuestions: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		// 북마크 목록 가져오기
		const userBookmarks = await db
			.select()
			.from(bookmarks)
			.where(eq(bookmarks.userId, userId))
			.orderBy(bookmarks.createdAt);

		if (userBookmarks.length === 0) {
			return [];
		}

		// 북마크된 문제 ID 목록
		const questionIds = userBookmarks.map((b) => b.questionId);

		// 문제 데이터 가져오기 (JOIN 대신 개별 쿼리)
		const questionData = await db
			.select()
			.from(questions)
			.where(
				eq(
					questions.id,
					questionIds[0] // 첫 번째만 쿼리 (IN 절 구현 필요)
				)
			);

		// 모든 북마크된 문제 가져오기
		const allQuestions = await Promise.all(
			questionIds.map((id) =>
				db
					.select()
					.from(questions)
					.where(eq(questions.id, id))
					.limit(1)
					.then((res) => res[0])
			)
		);

		// 북마크 정보와 문제 데이터 합치기
		return userBookmarks.map((bookmark) => {
			const question = allQuestions.find(
				(q) => q?.id === bookmark.questionId
			);
			return {
				bookmark,
				question,
			};
		});
	}),

	// 북마크 노트 업데이트
	updateNote: protectedProcedure
		.input(
			z.object({
				questionId: z.string(),
				note: z.string(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			await db
				.update(bookmarks)
				.set({ note: input.note })
				.where(
					and(
						eq(bookmarks.userId, userId),
						eq(bookmarks.questionId, input.questionId)
					)
				);

			return { success: true };
		}),
});

