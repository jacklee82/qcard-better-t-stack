import { pgTable, text, integer, timestamp, json, varchar, boolean } from "drizzle-orm/pg-core";

/**
 * 개선된 Questions 스키마
 * - 원본 데이터 불변성 보장
 * - 선택지 셔플 정보 저장
 * - 정답 검증 로직 단순화
 */
export const questionsV2 = pgTable("questions_v2", {
  // 기본 정보
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  question: text("question").notNull(),
  explanation: text("explanation").notNull(),
  code: text("code"),
  difficulty: text("difficulty").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),

  // 선택지 정보 (원본 불변)
  options: json("options").$type<string[]>().notNull(),
  correctAnswer: integer("correct_answer").notNull(), // 원본 정답 인덱스 (절대 변경 안됨)
  
  // 문제 타입
  questionType: varchar("question_type", { length: 20 }).notNull().default("single"),
  
  // 메타데이터
  isActive: boolean("is_active").notNull().default(true),
  version: integer("version").notNull().default(1),
});

/**
 * 문제 세션 테이블 (새로 추가)
 * - 각 문제 조회 시 생성되는 세션 정보
 * - 선택지 셔플 정보 저장
 * - 정답 검증용 정보 포함
 */
export const questionSessions = pgTable("question_sessions", {
  id: text("id").primaryKey(), // UUID
  questionId: text("question_id").notNull().references(() => questionsV2.id),
  userId: text("user_id"), // 로그인 사용자만
  
  // 셔플된 선택지 정보
  shuffledOptions: json("shuffled_options").$type<string[]>().notNull(),
  correctAnswerIndex: integer("correct_answer_index").notNull(), // 셔플된 정답 인덱스
  
  // 세션 메타데이터
  sessionType: varchar("session_type", { length: 20 }).notNull(), // 'study', 'review', 'test'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // 1시간 후 만료
  
  // 검증용 해시
  validationHash: text("validation_hash").notNull(), // 무결성 검증용
});

/**
 * 답안 제출 테이블 (개선)
 * - 정답 검증 로직 단순화
 * - 세션 기반 검증
 */
export const answerSubmissions = pgTable("answer_submissions", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => questionSessions.id),
  userId: text("user_id").notNull(),
  questionId: text("question_id").notNull().references(() => questionsV2.id),
  
  // 제출 정보
  selectedAnswerIndex: integer("selected_answer_index").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  
  // 검증 정보
  validationHash: text("validation_hash").notNull(),
  processingTimeMs: integer("processing_time_ms"),
});

export type QuestionV2 = typeof questionsV2.$inferSelect;
export type QuestionSession = typeof questionSessions.$inferSelect;
export type AnswerSubmission = typeof answerSubmissions.$inferSelect;

