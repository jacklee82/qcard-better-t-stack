import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  foreignKey,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const decks = pgTable(
  "decks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }).notNull(),
    is_public: boolean("is_public").default(false).notNull(),
    card_count: integer("card_count").default(0).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdFk: foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  })
);
