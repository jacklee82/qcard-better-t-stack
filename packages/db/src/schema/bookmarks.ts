import { pgTable, text, timestamp, serial, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { questions } from "./questions";

export const bookmarks = pgTable(
	"bookmarks",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		questionId: text("question_id")
			.notNull()
			.references(() => questions.id, { onDelete: "cascade" }),
		note: text("note"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		userQuestionUnique: unique().on(table.userId, table.questionId),
	})
);

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;


