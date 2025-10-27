#!/usr/bin/env node

/**
 * Environment Setup Script
 * 환경변수 설정 자동화 스크립트
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 환경변수 설정 스크립트 시작...\n');

// 환경변수 설정
const envConfigs = {
  native: {
    path: 'apps/native/.env',
    content: `# Native App Environment Variables
# 네이티브 앱 환경변수 설정

# API 서버 URL
EXPO_PUBLIC_SERVER_URL=http://localhost:3000

# 인증 우회 설정 (개발용)
EXPO_PUBLIC_BYPASS_AUTH=true

# 개발 모드 설정
NODE_ENV=development
`
  },
  api: {
    path: 'packages/api/.env',
    content: `# API Server Environment Variables
# API 서버 환경변수 설정

# 데이터베이스 URL
DATABASE_URL=postgresql://postgres:password@localhost:5432/qcard_db

# 개발 모드 설정
NODE_ENV=development
`
  },
  web: {
    path: 'apps/web/.env',
    content: `# Web App Environment Variables
# 웹 앱 환경변수 설정

# API 서버 URL
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# 개발 모드 설정
NODE_ENV=development
`
  }
};

// .env 파일 생성 함수
function createEnvFile(config) {
  const fullPath = path.join(process.cwd(), config.path);
  const dir = path.dirname(fullPath);
  
  // 디렉토리가 없으면 생성
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 디렉토리 생성: ${dir}`);
  }
  
  // .env 파일이 이미 있으면 백업
  if (fs.existsSync(fullPath)) {
    const backupPath = fullPath + '.backup';
    fs.copyFileSync(fullPath, backupPath);
    console.log(`💾 기존 .env 파일 백업: ${backupPath}`);
  }
  
  // .env 파일 생성
  fs.writeFileSync(fullPath, config.content);
  console.log(`✅ .env 파일 생성: ${config.path}`);
}

// 환경변수 검증 함수
function validateEnvironment() {
  console.log('\n🔍 환경변수 검증 중...\n');
  
  const errors = [];
  
  // 네이티브 앱 환경변수 확인
  const nativeEnvPath = path.join(process.cwd(), 'apps/native/.env');
  if (!fs.existsSync(nativeEnvPath)) {
    errors.push('네이티브 앱 .env 파일이 없습니다.');
  } else {
    const nativeEnv = fs.readFileSync(nativeEnvPath, 'utf8');
    if (!nativeEnv.includes('EXPO_PUBLIC_SERVER_URL')) {
      errors.push('네이티브 앱에 EXPO_PUBLIC_SERVER_URL이 설정되지 않았습니다.');
    }
    if (!nativeEnv.includes('EXPO_PUBLIC_BYPASS_AUTH')) {
      errors.push('네이티브 앱에 EXPO_PUBLIC_BYPASS_AUTH가 설정되지 않았습니다.');
    }
  }
  
  // API 서버 환경변수 확인
  const apiEnvPath = path.join(process.cwd(), 'packages/api/.env');
  if (!fs.existsSync(apiEnvPath)) {
    errors.push('API 서버 .env 파일이 없습니다.');
  } else {
    const apiEnv = fs.readFileSync(apiEnvPath, 'utf8');
    if (!apiEnv.includes('DATABASE_URL')) {
      errors.push('API 서버에 DATABASE_URL이 설정되지 않았습니다.');
    }
  }
  
  if (errors.length === 0) {
    console.log('✅ 모든 환경변수가 올바르게 설정되었습니다.');
  } else {
    console.log('❌ 환경변수 설정 오류:');
    errors.forEach(error => console.log(`  - ${error}`));
  }
  
  return errors.length === 0;
}

// 메인 실행
async function main() {
  try {
    // .env 파일들 생성
    console.log('📝 .env 파일 생성 중...\n');
    
    Object.entries(envConfigs).forEach(([name, config]) => {
      console.log(`${name} 앱 환경변수 설정:`);
      createEnvFile(config);
      console.log('');
    });
    
    // 환경변수 검증
    const isValid = validateEnvironment();
    
    if (isValid) {
      console.log('\n🎉 환경변수 설정이 완료되었습니다!');
      console.log('\n다음 단계:');
      console.log('1. 데이터베이스 서버 시작: pg_ctl start');
      console.log('2. API 서버 시작: cd packages/api && npm run dev');
      console.log('3. 네이티브 앱 시작: cd apps/native && npm start');
    } else {
      console.log('\n⚠️ 환경변수 설정에 문제가 있습니다. 수동으로 확인해주세요.');
    }
    
  } catch (error) {
    console.error('❌ 환경변수 설정 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { createEnvFile, validateEnvironment };


