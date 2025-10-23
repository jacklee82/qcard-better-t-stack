import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const studySessions = pgTable("study_sessions", {
	id: serial("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	mode: text("mode").notNull(), // 'sequential' | 'random' | 'category' | 'review'
	categoryFilter: text("category_filter"),
	difficultyFilter: text("difficulty_filter"),
	questionsCompleted: integer("questions_completed").notNull().default(0),
	correctAnswers: integer("correct_answers").notNull().default(0),
	startedAt: timestamp("started_at").notNull().defaultNow(),
	completedAt: timestamp("completed_at"),
});

export type StudySession = typeof studySessions.$inferSelect;
export type NewStudySession = typeof studySessions.$inferInsert;


