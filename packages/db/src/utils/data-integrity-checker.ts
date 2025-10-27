/**
 * Data Integrity Checker
 * 데이터 무결성 검증 및 문제 진단
 */

import { db, questions } from '../index';
import { sql } from 'drizzle-orm';

export interface DataIntegrityReport {
  isValid: boolean;
  totalQuestions: number;
  validQuestions: number;
  invalidQuestions: number;
  issues: DataIntegrityIssue[];
  statistics: {
    categories: Record<string, number>;
    difficulties: Record<string, number>;
    answerDistribution: Record<number, number>;
  };
}

export interface DataIntegrityIssue {
  type: 'missing_field' | 'invalid_field' | 'duplicate_id' | 'empty_options' | 'invalid_answer';
  questionId?: string;
  field?: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 데이터 무결성 검증을 수행합니다
 */
export async function checkDataIntegrity(): Promise<DataIntegrityReport> {
  console.log('🔍 데이터 무결성 검증 시작...\n');
  
  const issues: DataIntegrityIssue[] = [];
  let validQuestions = 0;
  let invalidQuestions = 0;
  
  try {
    // 1. 모든 문제 데이터 가져오기
    const allQuestions = await db.select().from(questions);
    const totalQuestions = allQuestions.length;
    
    console.log(`📊 총 문제 수: ${totalQuestions}개`);
    
    if (totalQuestions === 0) {
      return {
        isValid: false,
        totalQuestions: 0,
        validQuestions: 0,
        invalidQuestions: 0,
        issues: [{
          type: 'missing_field',
          message: '데이터베이스에 문제 데이터가 없습니다.',
          severity: 'critical'
        }],
        statistics: {
          categories: {},
          difficulties: {},
          answerDistribution: {}
        }
      };
    }
    
    // 2. 각 문제의 무결성 검증
    const questionIds = new Set<string>();
    const categories: Record<string, number> = {};
    const difficulties: Record<string, number> = {};
    const answerDistribution: Record<number, number> = {};
    
    for (const question of allQuestions) {
      let isQuestionValid = true;
      
      // ID 중복 검사
      if (questionIds.has(question.id)) {
        issues.push({
          type: 'duplicate_id',
          questionId: question.id,
          message: `중복된 ID: ${question.id}`,
          severity: 'high'
        });
        isQuestionValid = false;
      } else {
        questionIds.add(question.id);
      }
      
      // 필수 필드 검사
      const requiredFields = ['id', 'category', 'question', 'options', 'correctAnswer', 'explanation', 'difficulty'];
      for (const field of requiredFields) {
        if (!question[field as keyof typeof question] || question[field as keyof typeof question] === '') {
          issues.push({
            type: 'missing_field',
            questionId: question.id,
            field,
            message: `필수 필드 누락: ${field}`,
            severity: 'high'
          });
          isQuestionValid = false;
        }
      }
      
      // 선택지 검사
      if (Array.isArray(question.options)) {
        if (question.options.length === 0) {
          issues.push({
            type: 'empty_options',
            questionId: question.id,
            message: '선택지가 비어있습니다.',
            severity: 'high'
          });
          isQuestionValid = false;
        }
        
        // 선택지 내용 검사
        for (let i = 0; i < question.options.length; i++) {
          if (!question.options[i] || question.options[i].trim() === '') {
            issues.push({
              type: 'invalid_field',
              questionId: question.id,
              field: `options[${i}]`,
              message: `빈 선택지: ${i}번`,
              severity: 'medium'
            });
            isQuestionValid = false;
          }
        }
      } else {
        issues.push({
          type: 'invalid_field',
          questionId: question.id,
          field: 'options',
          message: '선택지가 배열이 아닙니다.',
          severity: 'high'
        });
        isQuestionValid = false;
      }
      
      // 정답 인덱스 검사
      if (typeof question.correctAnswer === 'number') {
        if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
          issues.push({
            type: 'invalid_answer',
            questionId: question.id,
            message: `정답 인덱스가 범위를 벗어남: ${question.correctAnswer} (선택지 개수: ${question.options.length})`,
            severity: 'high'
          });
          isQuestionValid = false;
        }
      } else {
        issues.push({
          type: 'invalid_field',
          questionId: question.id,
          field: 'correctAnswer',
          message: '정답이 숫자가 아닙니다.',
          severity: 'high'
        });
        isQuestionValid = false;
      }
      
      // 통계 수집
      if (isQuestionValid) {
        validQuestions++;
        
        // 카테고리 통계
        categories[question.category] = (categories[question.category] || 0) + 1;
        
        // 난이도 통계
        difficulties[question.difficulty] = (difficulties[question.difficulty] || 0) + 1;
        
        // 정답 분포 통계
        answerDistribution[question.correctAnswer] = (answerDistribution[question.correctAnswer] || 0) + 1;
      } else {
        invalidQuestions++;
      }
    }
    
    // 3. 전체 데이터 품질 평가
    const qualityScore = (validQuestions / totalQuestions) * 100;
    const isValid = qualityScore >= 95; // 95% 이상 유효해야 함
    
    console.log(`✅ 유효한 문제: ${validQuestions}개 (${qualityScore.toFixed(1)}%)`);
    console.log(`❌ 무효한 문제: ${invalidQuestions}개`);
    
    if (issues.length > 0) {
      console.log(`\n⚠️ 발견된 문제: ${issues.length}개`);
      
      // 심각도별 문제 분류
      const criticalIssues = issues.filter(issue => issue.severity === 'critical');
      const highIssues = issues.filter(issue => issue.severity === 'high');
      const mediumIssues = issues.filter(issue => issue.severity === 'medium');
      const lowIssues = issues.filter(issue => issue.severity === 'low');
      
      if (criticalIssues.length > 0) {
        console.log(`🔴 심각한 문제: ${criticalIssues.length}개`);
        criticalIssues.forEach(issue => console.log(`  - ${issue.message}`));
      }
      
      if (highIssues.length > 0) {
        console.log(`🟠 높은 우선순위: ${highIssues.length}개`);
        highIssues.slice(0, 5).forEach(issue => console.log(`  - ${issue.message}`));
        if (highIssues.length > 5) {
          console.log(`  ... 및 ${highIssues.length - 5}개 더`);
        }
      }
      
      if (mediumIssues.length > 0) {
        console.log(`🟡 중간 우선순위: ${mediumIssues.length}개`);
      }
      
      if (lowIssues.length > 0) {
        console.log(`🟢 낮은 우선순위: ${lowIssues.length}개`);
      }
    }
    
    // 4. 통계 정보 출력
    console.log('\n📊 데이터 통계:');
    console.log('카테고리별 분포:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}개`);
    });
    
    console.log('\n난이도별 분포:');
    Object.entries(difficulties).forEach(([difficulty, count]) => {
      console.log(`  ${difficulty}: ${count}개`);
    });
    
    console.log('\n정답 분포:');
    Object.entries(answerDistribution).forEach(([answer, count]) => {
      console.log(`  ${parseInt(answer) + 1}번: ${count}개`);
    });
    
    return {
      isValid,
      totalQuestions,
      validQuestions,
      invalidQuestions,
      issues,
      statistics: {
        categories,
        difficulties,
        answerDistribution
      }
    };
    
  } catch (error) {
    console.error('❌ 데이터 무결성 검증 실패:', error);
    
    return {
      isValid: false,
      totalQuestions: 0,
      validQuestions: 0,
      invalidQuestions: 0,
      issues: [{
        type: 'missing_field',
        message: `검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        severity: 'critical'
      }],
      statistics: {
        categories: {},
        difficulties: {},
        answerDistribution: {}
      }
    };
  }
}

/**
 * 데이터 무결성 문제를 자동으로 수정합니다
 */
export async function fixDataIntegrity(): Promise<{
  fixed: number;
  failed: number;
  errors: string[];
}> {
  console.log('🔧 데이터 무결성 문제 자동 수정 시작...\n');
  
  const report = await checkDataIntegrity();
  let fixed = 0;
  let failed = 0;
  const errors: string[] = [];
  
  if (report.isValid) {
    console.log('✅ 데이터가 이미 유효합니다. 수정할 필요가 없습니다.');
    return { fixed: 0, failed: 0, errors: [] };
  }
  
  // 수정 가능한 문제들 처리
  for (const issue of report.issues) {
    try {
      switch (issue.type) {
        case 'empty_options':
          // 빈 선택지 문제는 수동 수정 필요
          errors.push(`수동 수정 필요: ${issue.message}`);
          failed++;
          break;
          
        case 'invalid_answer':
          // 잘못된 정답 인덱스는 0으로 수정
          if (issue.questionId) {
            await db.update(questions)
              .set({ correctAnswer: 0 })
              .where(sql`id = ${issue.questionId}`);
            console.log(`✅ ${issue.questionId}: 정답 인덱스를 0으로 수정`);
            fixed++;
          }
          break;
          
        case 'missing_field':
          // 필수 필드 누락은 수동 수정 필요
          errors.push(`수동 수정 필요: ${issue.message}`);
          failed++;
          break;
          
        default:
          errors.push(`수정 불가능: ${issue.message}`);
          failed++;
      }
    } catch (error) {
      errors.push(`수정 실패: ${issue.message} - ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      failed++;
    }
  }
  
  console.log(`\n📊 수정 결과:`);
  console.log(`  ✅ 수정 완료: ${fixed}개`);
  console.log(`  ❌ 수정 실패: ${failed}개`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️ 수정 실패 사유:`);
    errors.forEach(error => console.log(`  - ${error}`));
  }
  
  return { fixed, failed, errors };
}

/**
 * 데이터 무결성 상태를 로깅합니다
 */
export async function logDataIntegrityStatus(): Promise<void> {
  console.log('🔍 데이터 무결성 상태 확인 중...\n');
  
  const report = await checkDataIntegrity();
  
  if (report.isValid) {
    console.log('🎉 데이터 무결성이 양호합니다!');
    console.log(`   총 문제: ${report.totalQuestions}개`);
    console.log(`   유효한 문제: ${report.validQuestions}개`);
    console.log(`   무효한 문제: ${report.invalidQuestions}개`);
  } else {
    console.log('⚠️ 데이터 무결성에 문제가 있습니다.');
    console.log(`   총 문제: ${report.totalQuestions}개`);
    console.log(`   유효한 문제: ${report.validQuestions}개`);
    console.log(`   무효한 문제: ${report.invalidQuestions}개`);
    console.log(`   발견된 문제: ${report.issues.length}개`);
  }
}

// 스크립트 실행
if (require.main === module) {
  async function main() {
    try {
      await logDataIntegrityStatus();
      
      const report = await checkDataIntegrity();
      if (!report.isValid) {
        console.log('\n🔧 자동 수정을 시도합니다...');
        const fixResult = await fixDataIntegrity();
        
        if (fixResult.fixed > 0) {
          console.log('\n🔄 수정 후 재검증 중...');
          await logDataIntegrityStatus();
        }
      }
      
      console.log('\n🎉 데이터 무결성 검증 완료!');
      
    } catch (error) {
      console.error('💥 데이터 무결성 검증 실패:', error);
      process.exit(1);
    }
  }
  
  main();
}


