/**
 * 호환성을 고려한 Question Router V2
 * - 기존 FIX 이슈들과의 호환성 보장
 * - Better Auth 연동
 * - tRPC Context 호환성
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../index";
import { db, questionsV2, questionSessions, answerSubmissions } from "@my-better-t-app/db";
import { eq, and, desc, sql, lt } from "drizzle-orm";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";

/**
 * Better Auth 호환성을 위한 세션 관리
 */
class AuthCompatibleSessionManager {
  /**
   * 사용자 ID 가져오기 (Better Auth 호환)
   */
  static async getUserId(ctx: any): Promise<string | null> {
    try {
      // Better Auth 세션에서 사용자 ID 추출
      if (ctx?.session?.user?.id) {
        return ctx.session.user.id;
      }
      return null;
    } catch (error) {
      console.warn('사용자 ID 추출 실패:', error);
      return null;
    }
  }

  /**
   * 인증 상태 확인
   */
  static isAuthenticated(ctx: any): boolean {
    return !!(ctx?.session?.user?.id);
  }
}

/**
 * tRPC Context 호환성을 위한 래퍼
 */
class TRPCContextWrapper {
  /**
   * NextRequest 호환성 보장
   */
  static createContext(req: any) {
    return {
      session: req.session || null,
      user: req.user || null,
      headers: req.headers || {},
    };
  }

  /**
   * 에러 핸들링
   */
  static handleError(error: any, context: string) {
    console.error(`[${context}] 오류 발생:`, error);
    
    // tRPC 에러로 변환
    if (error.code === 'PGRST116') {
      return new Error('데이터베이스 연결 실패');
    }
    
    return new Error(`서버 오류: ${error.message}`);
  }
}

export const questionV2CompatibleRouter = router({
  /**
   * 문제 세션 생성 (Better Auth 호환)
   */
  createSession: publicProcedure
    .input(z.object({
      questionId: z.string(),
      sessionType: z.enum(['study', 'review', 'test']).default('study'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
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
        const { shuffled, correctIndex } = shuffleOptions(
          originalQuestion.options,
          originalQuestion.correctAnswer
        );
        
        // 3. 세션 생성
        const sessionId = uuidv4();
        const userId = await AuthCompatibleSessionManager.getUserId(ctx);
        const validationHash = generateValidationHash(
          input.questionId,
          shuffled,
          correctIndex
        );
        
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        
        await db.insert(questionSessions).values({
          id: sessionId,
          questionId: input.questionId,
          userId: userId,
          shuffledOptions: shuffled,
          correctAnswerIndex: correctIndex,
          sessionType: input.sessionType,
          expiresAt,
          validationHash,
        });
        
        return {
          sessionId,
          question: {
            id: originalQuestion.id,
            category: originalQuestion.category,
            question: originalQuestion.question,
            options: shuffled,
            explanation: originalQuestion.explanation,
            code: originalQuestion.code,
            difficulty: originalQuestion.difficulty,
          },
          expiresAt,
        };
        
      } catch (error) {
        throw TRPCContextWrapper.handleError(error, 'createSession');
      }
    }),

  /**
   * 답안 제출 (인증 사용자 우선)
   */
  submitAnswer: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      selectedAnswerIndex: z.number().min(0).max(3),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // 1. 세션 조회
        const session = await db
          .select()
          .from(questionSessions)
          .where(eq(questionSessions.id, input.sessionId))
          .limit(1);
        
        if (!session[0]) {
          throw new Error('유효하지 않은 세션입니다.');
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
        const userId = await AuthCompatibleSessionManager.getUserId(ctx) || 'anonymous';
        
        await db.insert(answerSubmissions).values({
          id: submissionId,
          sessionId: input.sessionId,
          userId,
          questionId: questionSession.questionId,
          selectedAnswerIndex: input.selectedAnswerIndex,
          isCorrect,
          validationHash: generateValidationHash(
            questionSession.questionId,
            questionSession.shuffledOptions,
            questionSession.correctAnswerIndex
          ),
        });
        
        return {
          isCorrect,
          correctAnswerIndex: questionSession.correctAnswerIndex,
          explanation: await getQuestionExplanation(questionSession.questionId),
          sessionId: input.sessionId,
        };
        
      } catch (error) {
        throw TRPCContextWrapper.handleError(error, 'submitAnswer');
      }
    }),

  /**
   * 보호된 라우트 - 사용자 통계
   */
  getUserStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = await AuthCompatibleSessionManager.getUserId(ctx);
        if (!userId) {
          throw new Error('인증이 필요합니다.');
        }
        
        const stats = await db
          .select({
            totalSubmissions: sql<number>`count(*)`,
            correctSubmissions: sql<number>`count(case when ${answerSubmissions.isCorrect} then 1 end)`,
            averageTime: sql<number>`avg(${answerSubmissions.processingTimeMs})`,
          })
          .from(answerSubmissions)
          .where(eq(answerSubmissions.userId, userId));
        
        const result = stats[0];
        const accuracy = result?.totalSubmissions 
          ? (result.correctSubmissions / result.totalSubmissions) * 100 
          : 0;
        
        return {
          totalSubmissions: result?.totalSubmissions || 0,
          correctSubmissions: result?.correctSubmissions || 0,
          accuracy: Math.round(accuracy * 100) / 100,
          averageTime: result?.averageTime || 0,
        };
        
      } catch (error) {
        throw TRPCContextWrapper.handleError(error, 'getUserStats');
      }
    }),

  /**
   * 시스템 상태 확인
   */
  healthCheck: publicProcedure
    .query(async () => {
      try {
        // 데이터베이스 연결 확인
        await db.select().from(questionsV2).limit(1);
        
        // 만료된 세션 정리
        const expiredCount = await cleanupExpiredSessions();
        
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          expiredSessionsCleaned: expiredCount,
        };
        
      } catch (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
        };
      }
    }),
});

/**
 * 유틸리티 함수들
 */
function shuffleOptions(options: string[], correctAnswer: number): {
  shuffled: string[];
  correctIndex: number;
} {
  const shuffled = [...options];
  let correctIndex = correctAnswer;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    
    if (i === correctIndex) {
      correctIndex = j;
    } else if (j === correctIndex) {
      correctIndex = i;
    }
  }
  
  return { shuffled, correctIndex };
}

function generateValidationHash(
  questionId: string,
  shuffledOptions: string[],
  correctIndex: number,
  secret: string = "question-secret"
): string {
  const data = `${questionId}:${shuffledOptions.join(',')}:${correctIndex}:${secret}`;
  return createHash('sha256').update(data).digest('hex');
}

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

async function cleanupExpiredSessions(): Promise<number> {
  const now = new Date();
  const result = await db
    .delete(questionSessions)
    .where(lt(questionSessions.expiresAt, now));
  
  return result.rowCount || 0;
}
