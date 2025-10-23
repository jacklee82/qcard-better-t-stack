import { pgTable, text, integer, timestamp, json } from "drizzle-orm/pg-core";

export const questions = pgTable("questions", {
	id: text("id").primaryKey(),
	category: text("category").notNull(),
	question: text("question").notNull(),
	options: json("options").$type<string[]>().notNull(),
	correctAnswer: integer("correct_answer").notNull(),
	explanation: text("explanation").notNull(),
	code: text("code"),
	difficulty: text("difficulty").notNull(), // 'easy' | 'medium' | 'hard'
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

