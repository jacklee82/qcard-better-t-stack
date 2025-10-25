#!/usr/bin/env node

/**
 * Database Connection Fix Script
 * 데이터베이스 연결 오류 해결 스크립트
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 데이터베이스 연결 오류 해결 스크립트 시작...\n');

// 환경 설정
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/qcard_db';
const DB_PACKAGE_DIR = path.join(process.cwd(), 'packages', 'db');
const API_PACKAGE_DIR = path.join(process.cwd(), 'packages', 'api');

// PostgreSQL 서비스 상태 확인
function checkPostgreSQLService() {
  console.log('🔍 PostgreSQL 서비스 상태 확인 중...');
  
  try {
    execSync('pg_isready -q -h localhost -p 5432', { stdio: 'pipe' });
    console.log('✅ PostgreSQL 서비스가 실행 중입니다');
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL 서비스가 실행되지 않았습니다');
    console.log('   오류:', error.message);
    return false;
  }
}

// PostgreSQL 서비스 시작
function startPostgreSQLService() {
  console.log('🚀 PostgreSQL 서비스 시작 중...');
  
  try {
    // Windows
    if (process.platform === 'win32') {
      execSync('net start postgresql-x64-14', { stdio: 'pipe' });
      console.log('✅ PostgreSQL 서비스 시작됨 (Windows)');
    }
    // macOS
    else if (process.platform === 'darwin') {
      execSync('brew services start postgresql', { stdio: 'pipe' });
      console.log('✅ PostgreSQL 서비스 시작됨 (macOS)');
    }
    // Linux
    else {
      execSync('sudo systemctl start postgresql', { stdio: 'pipe' });
      console.log('✅ PostgreSQL 서비스 시작됨 (Linux)');
    }
    
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL 서비스 시작 실패');
    console.log('   오류:', error.message);
    console.log('   수동으로 PostgreSQL을 시작해주세요');
    return false;
  }
}

// 데이터베이스 연결 테스트
function testDatabaseConnection() {
  console.log('🔍 데이터베이스 연결 테스트 중...');
  
  try {
    execSync(`psql "${DATABASE_URL}" -c "SELECT 1;"`, { stdio: 'pipe' });
    console.log('✅ 데이터베이스 연결 성공');
    return true;
  } catch (error) {
    console.log('❌ 데이터베이스 연결 실패');
    console.log('   오류:', error.message);
    return false;
  }
}

// 데이터베이스 생성
function createDatabase() {
  console.log('🗄️ 데이터베이스 생성 중...');
  
  try {
    const dbName = 'qcard_db';
    const dbUser = 'postgres';
    const dbPassword = 'password';
    
    // 데이터베이스가 존재하는지 확인
    try {
      execSync(`psql -U ${dbUser} -h localhost -c "SELECT 1 FROM pg_database WHERE datname='${dbName}';"`, { 
        stdio: 'pipe',
        env: { ...process.env, PGPASSWORD: dbPassword }
      });
      console.log(`✅ 데이터베이스 '${dbName}'이 이미 존재합니다`);
      return true;
    } catch (error) {
      // 데이터베이스가 없으면 생성
      execSync(`psql -U ${dbUser} -h localhost -c "CREATE DATABASE ${dbName};"`, { 
        stdio: 'pipe',
        env: { ...process.env, PGPASSWORD: dbPassword }
      });
      console.log(`✅ 데이터베이스 '${dbName}' 생성됨`);
      return true;
    }
  } catch (error) {
    console.log('❌ 데이터베이스 생성 실패');
    console.log('   오류:', error.message);
    return false;
  }
}

// 환경 변수 설정
function setupEnvironmentVariables() {
  console.log('🔧 환경 변수 설정 중...');
  
  const envFiles = [
    {
      path: path.join(DB_PACKAGE_DIR, '.env'),
      content: `DATABASE_URL=${DATABASE_URL}\n`
    },
    {
      path: path.join(API_PACKAGE_DIR, '.env'),
      content: `DATABASE_URL=${DATABASE_URL}
BETTER_AUTH_SECRET=your-secret-key-here-${Date.now()}
CORS_ORIGIN=http://localhost:3000
VERCEL_URL=localhost:3000
`
    }
  ];
  
  envFiles.forEach(envFile => {
    try {
      // 디렉토리가 없으면 생성
      const dir = path.dirname(envFile.path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(envFile.path, envFile.content);
      console.log(`✅ ${envFile.path} 설정됨`);
    } catch (error) {
      console.log(`❌ ${envFile.path} 설정 실패: ${error.message}`);
    }
  });
}

// 마이그레이션 실행
function runMigrations() {
  console.log('🔄 마이그레이션 실행 중...');
  
  try {
    execSync('npm run migrate', { cwd: DB_PACKAGE_DIR, stdio: 'inherit' });
    console.log('✅ 마이그레이션 완료');
    return true;
  } catch (error) {
    console.log('❌ 마이그레이션 실패');
    console.log('   오류:', error.message);
    return false;
  }
}

// 시드 데이터 실행
function runSeedData() {
  console.log('🌱 시드 데이터 실행 중...');
  
  try {
    execSync('npm run seed', { cwd: DB_PACKAGE_DIR, stdio: 'inherit' });
    console.log('✅ 시드 데이터 완료');
    return true;
  } catch (error) {
    console.log('❌ 시드 데이터 실패');
    console.log('   오류:', error.message);
    return false;
  }
}

// 데이터베이스 상태 확인
function checkDatabaseStatus() {
  console.log('📊 데이터베이스 상태 확인 중...');
  
  try {
    // 테이블 존재 확인
    const tablesResult = execSync(`psql "${DATABASE_URL}" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"`, { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    console.log('📋 존재하는 테이블:');
    console.log(tablesResult);
    
    // questions 테이블 데이터 개수 확인
    const countResult = execSync(`psql "${DATABASE_URL}" -c "SELECT COUNT(*) FROM questions;"`, { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    console.log('📊 questions 테이블 데이터 개수:');
    console.log(countResult);
    
    return true;
  } catch (error) {
    console.log('❌ 데이터베이스 상태 확인 실패');
    console.log('   오류:', error.message);
    return false;
  }
}

// 문제 진단 및 해결
async function diagnoseAndFix() {
  console.log('🔍 데이터베이스 연결 문제 진단 중...\n');
  
  const issues = [];
  const solutions = [];
  
  // 1. PostgreSQL 서비스 확인
  if (!checkPostgreSQLService()) {
    issues.push('PostgreSQL 서비스가 실행되지 않았습니다.');
    solutions.push('PostgreSQL 서비스를 시작하세요.');
    
    if (startPostgreSQLService()) {
      console.log('✅ PostgreSQL 서비스 시작 성공');
    } else {
      console.log('❌ PostgreSQL 서비스 시작 실패');
    }
  }
  
  console.log('');
  
  // 2. 환경 변수 설정
  setupEnvironmentVariables();
  
  console.log('');
  
  // 3. 데이터베이스 생성
  if (!createDatabase()) {
    issues.push('데이터베이스 생성에 실패했습니다.');
    solutions.push('데이터베이스를 수동으로 생성하세요.');
  }
  
  console.log('');
  
  // 4. 데이터베이스 연결 테스트
  if (!testDatabaseConnection()) {
    issues.push('데이터베이스 연결에 실패했습니다.');
    solutions.push('데이터베이스 연결 설정을 확인하세요.');
  }
  
  console.log('');
  
  // 5. 마이그레이션 실행
  if (!runMigrations()) {
    issues.push('마이그레이션 실행에 실패했습니다.');
    solutions.push('마이그레이션을 수동으로 실행하세요.');
  }
  
  console.log('');
  
  // 6. 시드 데이터 실행
  if (!runSeedData()) {
    issues.push('시드 데이터 실행에 실패했습니다.');
    solutions.push('시드 데이터를 수동으로 실행하세요.');
  }
  
  console.log('');
  
  // 7. 데이터베이스 상태 확인
  if (!checkDatabaseStatus()) {
    issues.push('데이터베이스 상태 확인에 실패했습니다.');
    solutions.push('데이터베이스 상태를 수동으로 확인하세요.');
  }
  
  return { issues, solutions };
}

// 결과 요약
function summarizeResults(issues, solutions) {
  console.log('📊 데이터베이스 연결 문제 해결 결과:');
  console.log('='.repeat(50));
  
  if (issues.length === 0) {
    console.log('🎉 모든 데이터베이스 연결 문제가 해결되었습니다!');
  } else {
    console.log(`⚠️ 발견된 문제: ${issues.length}개`);
    issues.forEach(issue => console.log(`  - ${issue}`));
    
    console.log('\n🔧 해결 방법:');
    solutions.forEach(solution => console.log(`  - ${solution}`));
  }
  
  console.log('\n📋 다음 단계:');
  console.log('1. API 서버 시작: cd packages/api && npm run dev');
  console.log('2. 네이티브 앱 시작: cd apps/native && npm start');
  console.log('3. 데이터베이스 연결 상태 확인');
}

// 메인 실행
async function main() {
  try {
    console.log('🚀 데이터베이스 연결 문제 해결 시작...\n');
    
    const { issues, solutions } = await diagnoseAndFix();
    
    console.log('\n' + '='.repeat(50));
    summarizeResults(issues, solutions);
    
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { 
  checkPostgreSQLService, 
  startPostgreSQLService, 
  testDatabaseConnection, 
  createDatabase 
};
