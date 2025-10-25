import { pgTable, text, integer, timestamp, json, varchar } from "drizzle-orm/pg-core";

export const questions = pgTable("questions", {
	id: text("id").primaryKey(),
	category: text("category").notNull(),
	question: text("question").notNull(),
	options: json("options").$type<string[]>().notNull(),
	correctAnswer: integer("correct_answer").notNull(), // 기존 단일 정답 (호환성 유지)
	correctAnswers: json("correct_answers").$type<number[]>(), // 새로운 다중 정답 배열
	questionType: varchar("question_type", { length: 20 }).notNull().default("single"), // 'single' | 'multiple'
	explanation: text("explanation").notNull(),
	code: text("code"),
	difficulty: text("difficulty").notNull(), // 'easy' | 'medium' | 'hard'
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

// 다중 정답을 지원하는 확장된 타입
export interface MultipleAnswerQuestion extends Omit<Question, 'correctAnswer' | 'correctAnswers'> {
	correctAnswers: number[];
	questionType: 'single' | 'multiple';
}

// 셔플된 문제 타입 (다중 정답 지원)
export interface ShuffledMultipleAnswerQuestion extends MultipleAnswerQuestion {
	originalCorrectAnswers: number[];
}


