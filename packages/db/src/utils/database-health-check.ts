/**
 * Database Health Check Utility
 * 데이터베이스 연결 상태 및 데이터 무결성 검증
 */

import { db, questions } from '../index';
import { sql } from 'drizzle-orm';

export interface DatabaseHealthStatus {
  isConnected: boolean;
  hasQuestions: boolean;
  questionCount: number;
  lastQuestionId?: string;
  error?: string;
  connectionTime?: number;
}

/**
 * 데이터베이스 연결 상태를 확인합니다
 */
export async function checkDatabaseConnection(): Promise<DatabaseHealthStatus> {
  const startTime = Date.now();
  
  try {
    // 1. 기본 연결 테스트
    await db.execute(sql`SELECT 1`);
    
    // 2. questions 테이블 존재 확인
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'questions'
      )
    `);
    
    if (!tableExists.rows[0]?.exists) {
      return {
        isConnected: true,
        hasQuestions: false,
        questionCount: 0,
        error: 'questions 테이블이 존재하지 않습니다.'
      };
    }
    
    // 3. 문제 데이터 개수 확인
    const questionCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM questions`);
    const questionCount = parseInt(questionCountResult.rows[0]?.count || '0');
    
    // 4. 마지막 문제 ID 확인
    const lastQuestionResult = await db.execute(sql`
      SELECT id FROM questions 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    const lastQuestionId = lastQuestionResult.rows[0]?.id;
    
    const connectionTime = Date.now() - startTime;
    
    return {
      isConnected: true,
      hasQuestions: questionCount > 0,
      questionCount,
      lastQuestionId,
      connectionTime
    };
    
  } catch (error) {
    const connectionTime = Date.now() - startTime;
    
    return {
      isConnected: false,
      hasQuestions: false,
      questionCount: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      connectionTime
    };
  }
}

/**
 * 데이터베이스 연결 문제를 진단합니다
 */
export async function diagnoseDatabaseIssues(): Promise<{
  issues: string[];
  solutions: string[];
}> {
  const issues: string[] = [];
  const solutions: string[] = [];
  
  try {
    const health = await checkDatabaseConnection();
    
    // 연결 문제
    if (!health.isConnected) {
      issues.push('데이터베이스에 연결할 수 없습니다.');
      solutions.push('PostgreSQL 서버가 실행 중인지 확인하세요: pg_ctl start');
      solutions.push('DATABASE_URL 환경변수가 올바른지 확인하세요');
      solutions.push('데이터베이스 서버의 포트(5432)가 열려있는지 확인하세요');
    }
    
    // 테이블 문제
    if (health.isConnected && !health.hasQuestions) {
      issues.push('questions 테이블에 데이터가 없습니다.');
      solutions.push('시드 데이터를 실행하세요: cd packages/db && npm run seed');
      solutions.push('마이그레이션을 실행하세요: npm run db:migrate');
    }
    
    // 성능 문제
    if (health.connectionTime && health.connectionTime > 5000) {
      issues.push('데이터베이스 연결이 느립니다.');
      solutions.push('데이터베이스 서버의 성능을 확인하세요');
      solutions.push('네트워크 연결 상태를 확인하세요');
    }
    
    return { issues, solutions };
    
  } catch (error) {
    return {
      issues: ['데이터베이스 진단 중 오류가 발생했습니다.'],
      solutions: ['데이터베이스 서버 상태를 확인하세요']
    };
  }
}

/**
 * 데이터베이스 상태를 로깅합니다
 */
export async function logDatabaseStatus(): Promise<void> {
  console.log('🔍 데이터베이스 상태 확인 중...\n');
  
  const health = await checkDatabaseConnection();
  
  if (health.isConnected) {
    console.log('✅ 데이터베이스 연결 성공');
    console.log(`   연결 시간: ${health.connectionTime}ms`);
    console.log(`   문제 개수: ${health.questionCount}개`);
    
    if (health.hasQuestions) {
      console.log(`   마지막 문제 ID: ${health.lastQuestionId}`);
      console.log('✅ 문제 데이터가 정상적으로 존재합니다');
    } else {
      console.log('❌ 문제 데이터가 없습니다');
    }
  } else {
    console.log('❌ 데이터베이스 연결 실패');
    console.log(`   오류: ${health.error}`);
  }
  
  // 문제 진단
  const diagnosis = await diagnoseDatabaseIssues();
  if (diagnosis.issues.length > 0) {
    console.log('\n⚠️ 발견된 문제:');
    diagnosis.issues.forEach(issue => console.log(`  - ${issue}`));
    
    console.log('\n💡 해결 방법:');
    diagnosis.solutions.forEach(solution => console.log(`  - ${solution}`));
  } else {
    console.log('\n🎉 데이터베이스 상태가 정상입니다!');
  }
}

/**
 * 데이터베이스 연결 테스트 스크립트
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('🧪 데이터베이스 연결 테스트 시작...\n');
    
    await logDatabaseStatus();
    
    const health = await checkDatabaseConnection();
    return health.isConnected && health.hasQuestions;
    
  } catch (error) {
    console.error('❌ 데이터베이스 테스트 실패:', error);
    return false;
  }
}

// 스크립트 실행
if (require.main === module) {
  testDatabaseConnection().then((success) => {
    if (success) {
      console.log('\n🎉 데이터베이스 연결 테스트 성공!');
      process.exit(0);
    } else {
      console.log('\n💥 데이터베이스 연결 테스트 실패!');
      process.exit(1);
    }
  });
}


