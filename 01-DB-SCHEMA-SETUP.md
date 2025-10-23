# DB 스키마 파일 생성 가이드

## 파일 위치
```
packages/db/src/schema/
├── users.ts
├── decks.ts
├── cards.ts
├── progress.ts
└── index.ts
```

---

## 1️⃣ packages/db/src/schema/users.ts

```typescript
import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 100 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## 2️⃣ packages/db/src/schema/decks.ts

```typescript
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
```

---

## 3️⃣ packages/db/src/schema/cards.ts

```typescript
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
```

---

## 4️⃣ packages/db/src/schema/progress.ts

```typescript
import {
  pgTable,
  uuid,
  boolean,
  integer,
  timestamp,
  foreignKey,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { cards } from "./cards";

export const progress = pgTable(
  "progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").notNull(),
    card_id: uuid("card_id").notNull(),
    is_correct: boolean("is_correct"),
    attempt_count: integer("attempt_count").default(1).notNull(),
    last_attempted_at: timestamp("last_attempted_at").defaultNow().notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdFk: foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    cardIdFk: foreignKey({
      columns: [table.card_id],
      foreignColumns: [cards.id],
    }).onDelete("cascade"),
    uniqueUserCard: unique().on(table.user_id, table.card_id),
  })
);
```

---

## 5️⃣ packages/db/src/schema/index.ts

```typescript
export * from "./users";
export * from "./decks";
export * from "./cards";
export * from "./progress";
export * from "./auth";

// 모든 테이블 내보내기 (마이그레이션용)
export const allTables = {
  users: require("./users").users,
  decks: require("./decks").decks,
  cards: require("./cards").cards,
  progress: require("./progress").progress,
};
```

---

## 🔄 생성 후 실행 명령어

```bash
# Step 1: 위 파일들을 packages/db/src/schema/ 에 생성

# Step 2: 마이그레이션 생성
bun db:generate

# Step 3: 데이터베이스에 적용
bun db:push

# Step 4: 타입 체크
bun check-types
```

---

**상태**: 준비 완료 ✅  
**다음**: API 라우터 생성 (02-API-ROUTERS-SETUP.md)
