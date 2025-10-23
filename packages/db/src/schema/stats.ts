import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const userStats = pgTable("user_stats", {
	id: serial("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: "cascade" }),
	totalQuestions: integer("total_questions").notNull().default(0),
	correctAnswers: integer("correct_answers").notNull().default(0),
	totalAttempts: integer("total_attempts").notNull().default(0),
	streak: integer("streak").notNull().default(0),
	lastStudiedAt: timestamp("last_studied_at"),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserStats = typeof userStats.$inferSelect;
export type NewUserStats = typeof userStats.$inferInsert;

