import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  integer,
  timestamp,
  foreignKey,
} from "drizzle-orm/pg-core";
import { decks } from "./decks";

export const cards = pgTable(
  "cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deck_id: uuid("deck_id").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    question: text("question").notNull(),
    options: jsonb("options").notNull().$type<string[]>(),
    correct_answer: integer("correct_answer").notNull(),
    explanation: text("explanation"),
    code: varchar("code", { length: 500 }),
    difficulty: varchar("difficulty", { length: 20 }).notNull(),
    display_order: integer("display_order").default(0).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    deckIdFk: foreignKey({
      columns: [table.deck_id],
      foreignColumns: [decks.id],
    }).onDelete("cascade"),
  })
);
