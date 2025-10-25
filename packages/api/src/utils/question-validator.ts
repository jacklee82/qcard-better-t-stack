/**
 * 문제 검증 유틸리티
 * - 정답 정확성 검증
 * - 세션 무결성 검증
 * - 성능 테스트
 */

import { db, questionsV2, questionSessions, answerSubmissions } from "@my-better-t-app/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { createHash } from "crypto";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  statistics: {
    totalQuestions: number;
    validQuestions: number;
    invalidQuestions: number;
    averageProcessingTime: number;
  };
}

export class QuestionValidator {
  /**
   * 전체 시스템 검증
   */
  static async validateSystem(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // 1. 데이터베이스 연결 확인
      await this.validateDatabaseConnection();
      
      // 2. 문제 데이터 무결성 확인
      const questionValidation = await this.validateQuestions();
      errors.push(...questionValidation.errors);
      warnings.push(...questionValidation.warnings);
      
      // 3. 세션 데이터 확인
      const sessionValidation = await this.validateSessions();
      errors.push(...sessionValidation.errors);
      warnings.push(...sessionValidation.warnings);
      
      // 4. 답안 제출 데이터 확인
      const submissionValidation = await this.validateSubmissions();
      errors.push(...submissionValidation.errors);
      warnings.push(...submissionValidation.warnings);
      
      // 5. 통계 계산
      const statistics = await this.calculateStatistics();
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        statistics,
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [`시스템 검증 실패: ${error}`],
        warnings: [],
        statistics: {
          totalQuestions: 0,
          validQuestions: 0,
          invalidQuestions: 0,
          averageProcessingTime: 0,
        },
      };
    }
  }
  
  /**
   * 데이터베이스 연결 확인
   */
  private static async validateDatabaseConnection(): Promise<void> {
    try {
      await db.select().from(questionsV2).limit(1);
    } catch (error) {
      throw new Error(`데이터베이스 연결 실패: ${error}`);
    }
  }
  
  /**
   * 문제 데이터 검증
   */
  private static async validateQuestions(): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const questions = await db.select().from(questionsV2);
      
      for (const question of questions) {
        // 선택지 개수 확인
        if (question.options.length < 2) {
          errors.push(`문제 ${question.id}: 선택지가 2개 미만입니다.`);
        }
        
        // 정답 인덱스 범위 확인
        if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
          errors.push(`문제 ${question.id}: 정답 인덱스가 범위를 벗어났습니다.`);
        }
        
        // 빈 선택지 확인
        const emptyOptions = question.options.filter(option => !option.trim());
        if (emptyOptions.length > 0) {
          warnings.push(`문제 ${question.id}: 빈 선택지가 있습니다.`);
        }
        
        // 중복 선택지 확인
        const uniqueOptions = new Set(question.options);
        if (uniqueOptions.size !== question.options.length) {
          warnings.push(`문제 ${question.id}: 중복된 선택지가 있습니다.`);
        }
      }
      
    } catch (error) {
      errors.push(`문제 데이터 검증 실패: ${error}`);
    }
    
    return { errors, warnings };
  }
  
  /**
   * 세션 데이터 검증
   */
  private static async validateSessions(): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const sessions = await db.select().from(questionSessions);
      
      for (const session of sessions) {
        // 만료된 세션 확인
        if (new Date() > session.expiresAt) {
          warnings.push(`세션 ${session.id}: 만료된 세션입니다.`);
        }
        
        // 해시 검증
        const expectedHash = this.generateValidationHash(
          session.questionId,
          session.shuffledOptions,
          session.correctAnswerIndex
        );
        
        if (session.validationHash !== expectedHash) {
          errors.push(`세션 ${session.id}: 검증 해시가 일치하지 않습니다.`);
        }
        
        // 정답 인덱스 범위 확인
        if (session.correctAnswerIndex < 0 || session.correctAnswerIndex >= session.shuffledOptions.length) {
          errors.push(`세션 ${session.id}: 정답 인덱스가 범위를 벗어났습니다.`);
        }
      }
      
    } catch (error) {
      errors.push(`세션 데이터 검증 실패: ${error}`);
    }
    
    return { errors, warnings };
  }
  
  /**
   * 답안 제출 데이터 검증
   */
  private static async validateSubmissions(): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const submissions = await db.select().from(answerSubmissions);
      
      for (const submission of submissions) {
        // 세션 존재 확인
        const session = await db
          .select()
          .from(questionSessions)
          .where(eq(questionSessions.id, submission.sessionId))
          .limit(1);
        
        if (!session[0]) {
          errors.push(`제출 ${submission.id}: 참조하는 세션이 존재하지 않습니다.`);
          continue;
        }
        
        // 정답 검증
        const expectedCorrect = submission.selectedAnswerIndex === session[0].correctAnswerIndex;
        if (submission.isCorrect !== expectedCorrect) {
          errors.push(`제출 ${submission.id}: 정답 여부가 일치하지 않습니다.`);
        }
        
        // 처리 시간 확인
        if (submission.processingTimeMs && submission.processingTimeMs < 0) {
          warnings.push(`제출 ${submission.id}: 처리 시간이 음수입니다.`);
        }
      }
      
    } catch (error) {
      errors.push(`답안 제출 데이터 검증 실패: ${error}`);
    }
    
    return { errors, warnings };
  }
  
  /**
   * 통계 계산
   */
  private static async calculateStatistics() {
    try {
      const [questionStats, submissionStats] = await Promise.all([
        db.select({
          total: sql<number>`count(*)`,
          valid: sql<number>`count(case when ${questionsV2.isActive} then 1 end)`,
        }).from(questionsV2),
        
        db.select({
          total: sql<number>`count(*)`,
          correct: sql<number>`count(case when ${answerSubmissions.isCorrect} then 1 end)`,
          avgTime: sql<number>`avg(${answerSubmissions.processingTimeMs})`,
        }).from(answerSubmissions),
      ]);
      
      return {
        totalQuestions: questionStats[0]?.total || 0,
        validQuestions: questionStats[0]?.valid || 0,
        invalidQuestions: (questionStats[0]?.total || 0) - (questionStats[0]?.valid || 0),
        averageProcessingTime: submissionStats[0]?.avgTime || 0,
      };
      
    } catch (error) {
      return {
        totalQuestions: 0,
        validQuestions: 0,
        invalidQuestions: 0,
        averageProcessingTime: 0,
      };
    }
  }
  
  /**
   * 검증 해시 생성
   */
  private static generateValidationHash(
    questionId: string,
    shuffledOptions: string[],
    correctIndex: number,
    secret: string = "question-secret"
  ): string {
    const data = `${questionId}:${shuffledOptions.join(',')}:${correctIndex}:${secret}`;
    return createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * 성능 테스트
   */
  static async performanceTest(iterations: number = 100): Promise<{
    averageResponseTime: number;
    successRate: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    const responseTimes: number[] = [];
    let successCount = 0;
    
    try {
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        try {
          // 문제 조회 테스트
          const questions = await db.select().from(questionsV2).limit(1);
          if (questions.length > 0) {
            successCount++;
          }
          
          const endTime = Date.now();
          responseTimes.push(endTime - startTime);
          
        } catch (error) {
          errors.push(`반복 ${i + 1}: ${error}`);
        }
      }
      
      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const successRate = (successCount / iterations) * 100;
      
      return {
        averageResponseTime,
        successRate,
        errors,
      };
      
    } catch (error) {
      return {
        averageResponseTime: 0,
        successRate: 0,
        errors: [`성능 테스트 실패: ${error}`],
      };
    }
  }
}
