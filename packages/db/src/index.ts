import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "./schema/auth";
import * as questionSchema from "./schema/questions";
import * as progressSchema from "./schema/progress";
import * as sessionSchema from "./schema/sessions";
import * as bookmarkSchema from "./schema/bookmarks";
import * as statsSchema from "./schema/stats";
import * as goalSchema from "./schema/goals";

const schema = {
	...authSchema,
	...questionSchema,
	...progressSchema,
	...sessionSchema,
	...bookmarkSchema,
	...statsSchema,
	...goalSchema,
};

export const db = drizzle(process.env.DATABASE_URL || "", { schema });

export * as schema from "./schema/auth";
export { questions } from "./schema/questions";
export { userProgress } from "./schema/progress";
export { studySessions } from "./schema/sessions";
export { bookmarks } from "./schema/bookmarks";
export { userStats } from "./schema/stats";
export { goals } from "./schema/goals";

export type * from "./schema/auth";
export type * from "./schema/questions";
export type * from "./schema/progress";
export type * from "./schema/sessions";
export type * from "./schema/bookmarks";
export type * from "./schema/stats";
export type * from "./schema/goals";
