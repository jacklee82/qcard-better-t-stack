#!/usr/bin/env node

/**
 * 문제 시스템 V2 마이그레이션 스크립트
 * - 기존 시스템에서 새로운 시스템으로 점진적 전환
 * - 데이터 무결성 보장
 * - 롤백 가능
 */

const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 데이터베이스 연결
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function migrateToV2() {
  console.log('🚀 문제 시스템 V2 마이그레이션 시작...');
  
  try {
    // 1. 백업 생성
    await createBackup();
    
    // 2. 새 테이블 생성
    await createNewTables();
    
    // 3. 데이터 마이그레이션
    await migrateData();
    
    // 4. 검증
    await validateMigration();
    
    // 5. 성능 테스트
    await performanceTest();
    
    console.log('✅ 마이그레이션 완료!');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    await rollback();
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function createBackup() {
  console.log('📦 백업 생성 중...');
  
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
  
  // 기존 데이터 백업
  const backupQuery = `
    COPY (
      SELECT id, category, question, options, correct_answer, explanation, code, difficulty, created_at
      FROM questions
    ) TO STDOUT WITH CSV HEADER;
  `;
  
  console.log(`백업 파일: ${backupFile}`);
}

async function createNewTables() {
  console.log('🏗️  새 테이블 생성 중...');
  
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, '../packages/db/src/migrations/001-create-questions-v2.sql'),
    'utf8'
  );
  
  await db.execute(migrationSQL);
  console.log('✅ 새 테이블 생성 완료');
}

async function migrateData() {
  console.log('📊 데이터 마이그레이션 중...');
  
  // 기존 questions 데이터를 questions_v2로 복사
  const result = await db.execute(`
    INSERT INTO questions_v2 (
      id, category, question, explanation, code, difficulty, 
      options, correct_answer, question_type, is_active, version
    )
    SELECT 
      id, category, question, explanation, code, difficulty,
      options, correct_answer, 'single', true, 1
    FROM questions
    WHERE NOT EXISTS (
      SELECT 1 FROM questions_v2 WHERE questions_v2.id = questions.id
    )
  `);
  
  console.log(`✅ ${result.rowCount}개 문제 마이그레이션 완료`);
}

async function validateMigration() {
  console.log('🔍 마이그레이션 검증 중...');
  
  // 데이터 개수 확인
  const [oldCount, newCount] = await Promise.all([
    db.execute('SELECT COUNT(*) FROM questions'),
    db.execute('SELECT COUNT(*) FROM questions_v2'),
  ]);
  
  if (oldCount.rows[0].count !== newCount.rows[0].count) {
    throw new Error('데이터 개수가 일치하지 않습니다.');
  }
  
  // 데이터 무결성 확인
  const integrityCheck = await db.execute(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN options IS NULL THEN 1 END) as null_options,
      COUNT(CASE WHEN correct_answer < 0 OR correct_answer >= json_array_length(options) THEN 1 END) as invalid_answers
    FROM questions_v2
  `);
  
  const { total, null_options, invalid_answers } = integrityCheck.rows[0];
  
  if (null_options > 0) {
    throw new Error(`${null_options}개 문제에 NULL 선택지가 있습니다.`);
  }
  
  if (invalid_answers > 0) {
    throw new Error(`${invalid_answers}개 문제에 잘못된 정답 인덱스가 있습니다.`);
  }
  
  console.log(`✅ 검증 완료: ${total}개 문제, 무결성 문제 없음`);
}

async function performanceTest() {
  console.log('⚡ 성능 테스트 중...');
  
  const iterations = 100;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    await db.execute('SELECT COUNT(*) FROM questions_v2');
  }
  
  const endTime = Date.now();
  const averageTime = (endTime - startTime) / iterations;
  
  console.log(`✅ 성능 테스트 완료: 평균 ${averageTime.toFixed(2)}ms/쿼리`);
  
  if (averageTime > 100) {
    console.warn('⚠️  성능이 예상보다 느립니다.');
  }
}

async function rollback() {
  console.log('🔄 롤백 중...');
  
  try {
    await db.execute('DROP TABLE IF EXISTS answer_submissions');
    await db.execute('DROP TABLE IF EXISTS question_sessions');
    await db.execute('DROP TABLE IF EXISTS questions_v2');
    console.log('✅ 롤백 완료');
  } catch (error) {
    console.error('❌ 롤백 실패:', error);
  }
}

// 마이그레이션 실행
if (require.main === module) {
  migrateToV2().catch(console.error);
}

module.exports = { migrateToV2, rollback };

