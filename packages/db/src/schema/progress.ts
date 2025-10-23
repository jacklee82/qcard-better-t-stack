import { pgTable, text, integer, boolean, timestamp, serial, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { questions } from "./questions";

export const userProgress = pgTable(
	"user_progress",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		questionId: text("question_id")
			.notNull()
			.references(() => questions.id, { onDelete: "cascade" }),
		isCorrect: boolean("is_correct").notNull(),
		selectedAnswer: integer("selected_answer").notNull(),
		attemptCount: integer("attempt_count").notNull().default(1),
		lastAttemptedAt: timestamp("last_attempted_at").notNull().defaultNow(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		userQuestionUnique: unique().on(table.userId, table.questionId),
	})
);

export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;


