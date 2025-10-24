import { pgTable, serial, text, integer, real, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  targetAccuracy: real('target_accuracy'), // 목표 정답률 (0.0 ~ 1.0)
  dailyQuestionTarget: integer('daily_question_target'), // 일일 목표 문제 수
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
