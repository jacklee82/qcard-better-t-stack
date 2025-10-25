#!/usr/bin/env node

/**
 * Data Integrity Fix Script
 * 데이터 무결성 문제 해결 스크립트
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 데이터 무결성 문제 해결 스크립트 시작...\n');

// JSON 파일 검증
function validateQuestionsJSON() {
  console.log('📄 all-questions.json 파일 검증 중...');
  
  try {
    const jsonPath = path.join(process.cwd(), 'all-questions.json');
    
    if (!fs.existsSync(jsonPath)) {
      console.log('❌ all-questions.json 파일이 없습니다.');
      return false;
    }
    
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const questions = JSON.parse(jsonContent);
    
    if (!Array.isArray(questions)) {
      console.log('❌ JSON 파일이 배열 형태가 아닙니다.');
      return false;
    }
    
    console.log(`✅ JSON 파일 검증 성공: ${questions.length}개 문제`);
    
    // 기본 검증
    let validCount = 0;
    let invalidCount = 0;
    const issues = [];
    
    questions.forEach((question, index) => {
      let isValid = true;
      
      // 필수 필드 검사
      const requiredFields = ['id', 'category', 'question', 'options', 'correctAnswer', 'explanation', 'difficulty'];
      for (const field of requiredFields) {
        if (!question[field] || question[field] === '') {
          issues.push(`문제 ${index + 1}: 필수 필드 누락 - ${field}`);
          isValid = false;
        }
      }
      
      // options 배열 검사
      if (Array.isArray(question.options)) {
        if (question.options.length === 0) {
          issues.push(`문제 ${index + 1}: 선택지가 비어있습니다.`);
          isValid = false;
        }
        
        // 선택지 내용 검사
        question.options.forEach((option, optionIndex) => {
          if (!option || option.trim() === '') {
            issues.push(`문제 ${index + 1}: 빈 선택지 - ${optionIndex}번`);
            isValid = false;
          }
        });
      } else {
        issues.push(`문제 ${index + 1}: 선택지가 배열이 아닙니다.`);
        isValid = false;
      }
      
      // 정답 인덱스 검사
      if (typeof question.correctAnswer === 'number') {
        if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
          issues.push(`문제 ${index + 1}: 정답 인덱스가 범위를 벗어남 (${question.correctAnswer}/${question.options.length})`);
          isValid = false;
        }
      } else {
        issues.push(`문제 ${index + 1}: 정답이 숫자가 아닙니다.`);
        isValid = false;
      }
      
      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
      }
    });
    
    console.log(`📊 검증 결과:`);
    console.log(`  ✅ 유효한 문제: ${validCount}개`);
    console.log(`  ❌ 무효한 문제: ${invalidCount}개`);
    
    if (issues.length > 0) {
      console.log(`\n⚠️ 발견된 문제 (최대 10개):`);
      issues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
      if (issues.length > 10) {
        console.log(`  ... 및 ${issues.length - 10}개 더`);
      }
    }
    
    return invalidCount === 0;
    
  } catch (error) {
    console.log('❌ JSON 파일 검증 실패:', error.message);
    return false;
  }
}

// 데이터베이스 무결성 검사
function checkDatabaseIntegrity() {
  console.log('\n🔍 데이터베이스 무결성 검사 중...');
  
  try {
    // 데이터베이스 연결 테스트
    execSync('cd packages/db && npm run db:check', { stdio: 'pipe' });
    console.log('✅ 데이터베이스 연결 성공');
    
    // 문제 개수 확인
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/qcard_db';
    const result = execSync(`psql "${dbUrl}" -c "SELECT COUNT(*) FROM questions;"`, { encoding: 'utf8' });
    const count = parseInt(result.match(/\d+/)?.[0] || '0');
    
    console.log(`📊 데이터베이스 문제 개수: ${count}개`);
    
    if (count === 0) {
      console.log('❌ 데이터베이스에 문제 데이터가 없습니다.');
      return false;
    }
    
    // 중복 ID 검사
    const duplicateResult = execSync(`psql "${dbUrl}" -c "SELECT id, COUNT(*) FROM questions GROUP BY id HAVING COUNT(*) > 1;"`, { encoding: 'utf8' });
    if (duplicateResult.includes('rows)')) {
      console.log('⚠️ 중복된 ID가 발견되었습니다.');
      return false;
    }
    
    console.log('✅ 데이터베이스 무결성 검사 통과');
    return true;
    
  } catch (error) {
    console.log('❌ 데이터베이스 무결성 검사 실패:', error.message);
    return false;
  }
}

// 데이터 재시드
function reseedDatabase() {
  console.log('\n🌱 데이터베이스 재시드 중...');
  
  try {
    // 기존 데이터 삭제
    console.log('🗑️ 기존 데이터 삭제 중...');
    execSync('cd packages/db && npm run db:reset', { stdio: 'inherit' });
    
    // 마이그레이션 실행
    console.log('🔄 마이그레이션 실행 중...');
    execSync('cd packages/db && npm run migrate', { stdio: 'inherit' });
    
    // 시드 데이터 실행
    console.log('🌱 시드 데이터 실행 중...');
    execSync('cd packages/db && npm run seed', { stdio: 'inherit' });
    
    console.log('✅ 데이터베이스 재시드 완료');
    return true;
    
  } catch (error) {
    console.log('❌ 데이터베이스 재시드 실패:', error.message);
    return false;
  }
}

// 문제 진단 및 해결
async function diagnoseAndFix() {
  console.log('🔍 데이터 무결성 문제 진단 중...\n');
  
  const issues = [];
  const solutions = [];
  
  // 1. JSON 파일 검증
  if (!validateQuestionsJSON()) {
    issues.push('all-questions.json 파일에 문제가 있습니다.');
    solutions.push('JSON 파일의 형식을 확인하고 수정하세요.');
  }
  
  // 2. 데이터베이스 무결성 검사
  if (!checkDatabaseIntegrity()) {
    issues.push('데이터베이스에 무결성 문제가 있습니다.');
    solutions.push('데이터베이스 재시드를 실행하세요.');
    
    console.log('\n🔧 데이터베이스 재시드를 시도합니다...');
    if (reseedDatabase()) {
      console.log('✅ 데이터베이스 재시드 성공!');
    } else {
      console.log('❌ 데이터베이스 재시드 실패!');
    }
  }
  
  // 3. 최종 검증
  console.log('\n🔍 최종 검증 중...');
  if (checkDatabaseIntegrity()) {
    console.log('🎉 모든 데이터 무결성 문제가 해결되었습니다!');
    return true;
  } else {
    console.log('⚠️ 일부 문제가 남아있습니다.');
    return false;
  }
}

// 메인 실행
async function main() {
  try {
    const success = await diagnoseAndFix();
    
    if (success) {
      console.log('\n🎉 데이터 무결성 문제 해결 완료!');
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
  validateQuestionsJSON, 
  checkDatabaseIntegrity, 
  reseedDatabase 
};

