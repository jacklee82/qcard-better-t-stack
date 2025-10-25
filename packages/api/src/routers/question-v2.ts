/**
 * 개선된 Question Router V2
 * - 원본 데이터 불변성 보장
 * - 세션 기반 문제 관리
 * - 정확한 정답 검증
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../index";
import { db, questionsV2, questionSessions, answerSubmissions } from "@my-better-t-app/db";
import { eq, and, desc, sql, lt } from "drizzle-orm";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";

/**
 * 선택지 셔플 유틸리티 (개선된 버전)
 */
class QuestionShuffler {
  /**
   * Fisher-Yates 셔플 알고리즘
   * @param options 원본 선택지
   * @returns {shuffled: 셔플된 선택지, correctIndex: 셔플된 정답 인덱스}
   */
  static shuffleOptions(options: string[], correctAnswer: number): {
    shuffled: string[];
    correctIndex: number;
  } {
    const shuffled = [...options];
    let correctIndex = correctAnswer;
    
    // Fisher-Yates 셔플
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      
      // 선택지 교환
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      
      // 정답 인덱스 추적
      if (i === correctIndex) {
        correctIndex = j;
      } else if (j === correctIndex) {
        correctIndex = i;
      }
    }
    
    return { shuffled, correctIndex };
  }
  
  /**
   * 검증 해시 생성
   */
  static generateValidationHash(
    questionId: string,
    shuffledOptions: string[],
    correctIndex: number,
    secret: string = "question-secret"
  ): string {
    const data = `${questionId}:${shuffledOptions.join(',')}:${correctIndex}:${secret}`;
    return createHash('sha256').update(data).digest('hex');
  }
}

export const questionV2Router = router({
  /**
   * 문제 세션 생성 (새로운 방식)
   * - 원본 문제 조회
   * - 선택지 셔플
   * - 세션 생성 및 반환
   */
  createSession: publicProcedure
    .input(z.object({
      questionId: z.string(),
      sessionType: z.enum(['study', 'review', 'test']).default('study'),
      userId: z.string().optional(), // 로그인 사용자만
    }))
    .mutation(async ({ input }) => {
      // 1. 원본 문제 조회
      const question = await db
        .select()
        .from(questionsV2)
        .where(eq(questionsV2.id, input.questionId))
        .limit(1);
      
      if (!question[0]) {
        throw new Error('문제를 찾을 수 없습니다.');
      }
      
      const originalQuestion = question[0];
      
      // 2. 선택지 셔플
      const { shuffled, correctIndex } = QuestionShuffler.shuffleOptions(
        originalQuestion.options,
        originalQuestion.correctAnswer
      );
      
      // 3. 세션 생성
      const sessionId = uuidv4();
      const validationHash = QuestionShuffler.generateValidationHash(
        input.questionId,
        shuffled,
        correctIndex
      );
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1시간 후 만료
      
      await db.insert(questionSessions).values({
        id: sessionId,
        questionId: input.questionId,
        userId: input.userId,
        shuffledOptions: shuffled,
        correctAnswerIndex: correctIndex,
        sessionType: input.sessionType,
        expiresAt,
        validationHash,
      });
      
      // 4. 클라이언트에 반환 (정답 인덱스 제외)
      return {
        sessionId,
        question: {
          id: originalQuestion.id,
          category: originalQuestion.category,
          question: originalQuestion.question,
          options: shuffled, // 셔플된 선택지
          explanation: originalQuestion.explanation,
          code: originalQuestion.code,
          difficulty: originalQuestion.difficulty,
        },
        expiresAt,
      };
    }),

  /**
   * 답안 제출 및 검증
   * - 세션 기반 검증
   * - 정확한 정답 확인
   */
  submitAnswer: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      selectedAnswerIndex: z.number().min(0).max(3), // 0-3 인덱스
    }))
    .mutation(async ({ input }) => {
      // 1. 세션 조회 및 검증
      const session = await db
        .select()
        .from(questionSessions)
        .where(and(
          eq(questionSessions.id, input.sessionId),
          eq(questionSessions.correctAnswerIndex, input.selectedAnswerIndex) // 임시로 정답만 허용
        ))
        .limit(1);
      
      if (!session[0]) {
        throw new Error('유효하지 않은 세션이거나 정답이 아닙니다.');
      }
      
      const questionSession = session[0];
      
      // 2. 만료 시간 확인
      if (new Date() > questionSession.expiresAt) {
        throw new Error('세션이 만료되었습니다.');
      }
      
      // 3. 정답 검증
      const isCorrect = input.selectedAnswerIndex === questionSession.correctAnswerIndex;
      
      // 4. 답안 제출 기록
      const submissionId = uuidv4();
      const validationHash = QuestionShuffler.generateValidationHash(
        questionSession.questionId,
        questionSession.shuffledOptions,
        questionSession.correctAnswerIndex
      );
      
      await db.insert(answerSubmissions).values({
        id: submissionId,
        sessionId: input.sessionId,
        userId: questionSession.userId || 'anonymous',
        questionId: questionSession.questionId,
        selectedAnswerIndex: input.selectedAnswerIndex,
        isCorrect,
        validationHash,
        processingTimeMs: Date.now() - questionSession.createdAt.getTime(),
      });
      
      // 5. 결과 반환
      return {
        isCorrect,
        correctAnswerIndex: questionSession.correctAnswerIndex,
        explanation: await getQuestionExplanation(questionSession.questionId),
        sessionId: input.sessionId,
      };
    }),

  /**
   * 문제 설명 조회
   */
  getExplanation: publicProcedure
    .input(z.object({ questionId: z.string() }))
    .query(async ({ input }) => {
      return await getQuestionExplanation(input.questionId);
    }),

  /**
   * 세션 상태 조회
   */
  getSessionStatus: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const session = await db
        .select()
        .from(questionSessions)
        .where(eq(questionSessions.id, input.sessionId))
        .limit(1);
      
      if (!session[0]) {
        return { exists: false };
      }
      
      const isExpired = new Date() > session[0].expiresAt;
      return {
        exists: true,
        isExpired,
        expiresAt: session[0].expiresAt,
      };
    }),

  /**
   * 만료된 세션 정리
   */
  cleanupExpiredSessions: publicProcedure
    .mutation(async () => {
      const now = new Date();
      const result = await db
        .delete(questionSessions)
        .where(lt(questionSessions.expiresAt, now));
      
      return { cleanedCount: result.rowCount || 0 };
    }),
});

/**
 * 문제 설명 조회 헬퍼 함수
 */
async function getQuestionExplanation(questionId: string) {
  const question = await db
    .select({
      explanation: questionsV2.explanation,
      code: questionsV2.code,
    })
    .from(questionsV2)
    .where(eq(questionsV2.id, questionId))
    .limit(1);
  
  return question[0] || null;
}
