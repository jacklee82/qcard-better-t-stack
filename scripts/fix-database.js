#!/usr/bin/env node

/**
 * Database Fix Script
 * 데이터베이스 연결 문제 해결 스크립트
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 데이터베이스 문제 해결 스크립트 시작...\n');

// PostgreSQL 서비스 상태 확인
function checkPostgreSQLStatus() {
  console.log('🔍 PostgreSQL 서비스 상태 확인...');
  
  try {
    // Windows
    if (process.platform === 'win32') {
      const result = execSync('sc query postgresql', { encoding: 'utf8' });
      if (result.includes('RUNNING')) {
        console.log('✅ PostgreSQL 서비스가 실행 중입니다.');
        return true;
      } else {
        console.log('❌ PostgreSQL 서비스가 실행되지 않았습니다.');
        return false;
      }
    }
    // macOS/Linux
    else {
      const result = execSync('pg_ctl status', { encoding: 'utf8' });
      if (result.includes('server is running')) {
        console.log('✅ PostgreSQL 서버가 실행 중입니다.');
        return true;
      } else {
        console.log('❌ PostgreSQL 서버가 실행되지 않았습니다.');
        return false;
      }
    }
  } catch (error) {
    console.log('❌ PostgreSQL 서비스 상태를 확인할 수 없습니다.');
    console.log('   오류:', error.message);
    return false;
  }
}

// PostgreSQL 서비스 시작
function startPostgreSQL() {
  console.log('🚀 PostgreSQL 서비스 시작 중...');
  
  try {
    if (process.platform === 'win32') {
      execSync('net start postgresql', { stdio: 'inherit' });
    } else {
      execSync('pg_ctl start', { stdio: 'inherit' });
    }
    console.log('✅ PostgreSQL 서비스가 시작되었습니다.');
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL 서비스 시작 실패:', error.message);
    return false;
  }
}

// 데이터베이스 연결 테스트
function testDatabaseConnection() {
  console.log('🧪 데이터베이스 연결 테스트...');
  
  try {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/qcard_db';
    execSync(`psql "${dbUrl}" -c "SELECT 1;"`, { stdio: 'inherit' });
    console.log('✅ 데이터베이스 연결 성공!');
    return true;
  } catch (error) {
    console.log('❌ 데이터베이스 연결 실패:', error.message);
    return false;
  }
}

// 데이터베이스 생성
function createDatabase() {
  console.log('📁 데이터베이스 생성 중...');
  
  try {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/qcard_db';
    const dbName = 'qcard_db';
    
    // 데이터베이스 생성
    execSync(`createdb "${dbName}"`, { stdio: 'inherit' });
    console.log(`✅ 데이터베이스 '${dbName}' 생성 완료!`);
    return true;
  } catch (error) {
    console.log('❌ 데이터베이스 생성 실패:', error.message);
    return false;
  }
}

// 마이그레이션 실행
function runMigrations() {
  console.log('🔄 마이그레이션 실행 중...');
  
  try {
    execSync('cd packages/db && npm run migrate', { stdio: 'inherit' });
    console.log('✅ 마이그레이션 완료!');
    return true;
  } catch (error) {
    console.log('❌ 마이그레이션 실패:', error.message);
    return false;
  }
}

// 시드 데이터 실행
function runSeedData() {
  console.log('🌱 시드 데이터 실행 중...');
  
  try {
    execSync('cd packages/db && npm run seed', { stdio: 'inherit' });
    console.log('✅ 시드 데이터 완료!');
    return true;
  } catch (error) {
    console.log('❌ 시드 데이터 실패:', error.message);
    return false;
  }
}

// 문제 진단 및 해결
async function diagnoseAndFix() {
  console.log('🔍 데이터베이스 문제 진단 중...\n');
  
  const issues = [];
  const solutions = [];
  
  // 1. PostgreSQL 서비스 확인
  if (!checkPostgreSQLStatus()) {
    issues.push('PostgreSQL 서비스가 실행되지 않았습니다.');
    solutions.push('PostgreSQL 서비스를 시작하세요.');
    
    if (!startPostgreSQL()) {
      issues.push('PostgreSQL 서비스 시작에 실패했습니다.');
      solutions.push('PostgreSQL을 수동으로 설치하고 시작하세요.');
    }
  }
  
  // 2. 데이터베이스 연결 확인
  if (!testDatabaseConnection()) {
    issues.push('데이터베이스에 연결할 수 없습니다.');
    solutions.push('데이터베이스가 존재하는지 확인하세요.');
    
    if (!createDatabase()) {
      issues.push('데이터베이스 생성에 실패했습니다.');
      solutions.push('PostgreSQL 사용자 권한을 확인하세요.');
    }
  }
  
  // 3. 마이그레이션 확인
  try {
    execSync('cd packages/db && npm run migrate', { stdio: 'pipe' });
  } catch (error) {
    issues.push('마이그레이션이 실행되지 않았습니다.');
    solutions.push('마이그레이션을 실행하세요.');
    
    if (!runMigrations()) {
      issues.push('마이그레이션 실행에 실패했습니다.');
      solutions.push('데이터베이스 스키마를 수동으로 확인하세요.');
    }
  }
  
  // 4. 시드 데이터 확인
  try {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/qcard_db';
    const result = execSync(`psql "${dbUrl}" -c "SELECT COUNT(*) FROM questions;"`, { encoding: 'utf8' });
    const count = parseInt(result.match(/\d+/)?.[0] || '0');
    
    if (count === 0) {
      issues.push('데이터베이스에 문제 데이터가 없습니다.');
      solutions.push('시드 데이터를 실행하세요.');
      
      if (!runSeedData()) {
        issues.push('시드 데이터 실행에 실패했습니다.');
        solutions.push('all-questions.json 파일을 확인하세요.');
      }
    } else {
      console.log(`✅ 데이터베이스에 ${count}개의 문제가 있습니다.`);
    }
  } catch (error) {
    issues.push('데이터베이스 쿼리에 실패했습니다.');
    solutions.push('데이터베이스 연결을 확인하세요.');
  }
  
  // 결과 출력
  if (issues.length === 0) {
    console.log('\n🎉 모든 데이터베이스 문제가 해결되었습니다!');
    return true;
  } else {
    console.log('\n⚠️ 발견된 문제:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    
    console.log('\n💡 해결 방법:');
    solutions.forEach(solution => console.log(`  - ${solution}`));
    
    return false;
  }
}

// 메인 실행
async function main() {
  try {
    const success = await diagnoseAndFix();
    
    if (success) {
      console.log('\n🎉 데이터베이스 문제 해결 완료!');
      console.log('\n다음 단계:');
      console.log('1. API 서버 시작: cd packages/api && npm run dev');
      console.log('2. 네이티브 앱 시작: cd apps/native && npm start');
    } else {
      console.log('\n💥 일부 문제가 해결되지 않았습니다.');
      console.log('수동으로 확인해주세요.');
    }
    
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { 
  checkPostgreSQLStatus, 
  startPostgreSQL, 
  testDatabaseConnection, 
  createDatabase, 
  runMigrations, 
  runSeedData 
};

