#!/usr/bin/env node

/**
 * Authentication Diagnosis Script
 * 인증 상태 진단 및 문제 해결 스크립트
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🔐 인증 상태 진단 스크립트 시작...\n');

// 환경 설정
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';
const AUTH_PACKAGE_DIR = path.join(process.cwd(), 'packages', 'auth');
const NATIVE_APP_DIR = path.join(process.cwd(), 'apps', 'native');

// 환경 변수 검증
function validateAuthEnvironment() {
  console.log('🔍 인증 관련 환경 변수 검증 중...');
  
  const requiredEnvVars = [
    'BETTER_AUTH_SECRET',
    'EXPO_PUBLIC_SERVER_URL',
    'EXPO_PUBLIC_BYPASS_AUTH'
  ];
  
  const missingVars = [];
  const invalidVars = [];
  
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else {
      // 특별한 검증
      if (varName === 'EXPO_PUBLIC_BYPASS_AUTH') {
        if (!['true', 'false'].includes(value.toLowerCase())) {
          invalidVars.push(`${varName} (값: ${value}, 예상: true/false)`);
        }
      }
    }
  });
  
  if (missingVars.length > 0) {
    console.log(`❌ 누락된 환경 변수: ${missingVars.join(', ')}`);
    return false;
  }
  
  if (invalidVars.length > 0) {
    console.log(`❌ 잘못된 환경 변수: ${invalidVars.join(', ')}`);
    return false;
  }
  
  console.log('✅ 모든 인증 환경 변수가 올바르게 설정되었습니다');
  return true;
}

// Better Auth 설정 검증
function validateBetterAuthConfig() {
  console.log('🔧 Better Auth 설정 검증 중...');
  
  try {
    // auth 패키지 디렉토리 확인
    if (!fs.existsSync(AUTH_PACKAGE_DIR)) {
      console.log('❌ auth 패키지 디렉토리가 없습니다');
      return false;
    }
    
    // auth 설정 파일 확인
    const authFiles = [
      'src/index.ts',
      'package.json'
    ];
    
    const missingFiles = [];
    authFiles.forEach(file => {
      const filePath = path.join(AUTH_PACKAGE_DIR, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    });
    
    if (missingFiles.length > 0) {
      console.log(`❌ 누락된 auth 파일: ${missingFiles.join(', ')}`);
      return false;
    }
    
    // TypeScript 컴파일 검증
    console.log('🔍 TypeScript 컴파일 검증 중...');
    execSync('npx tsc --noEmit', { cwd: AUTH_PACKAGE_DIR, stdio: 'pipe' });
    console.log('✅ Better Auth TypeScript 컴파일 성공');
    
    return true;
    
  } catch (error) {
    console.log(`❌ Better Auth 설정 검증 실패: ${error.message}`);
    return false;
  }
}

// 네이티브 앱 인증 설정 검증
function validateNativeAuthConfig() {
  console.log('📱 네이티브 앱 인증 설정 검증 중...');
  
  try {
    // 네이티브 앱 디렉토리 확인
    if (!fs.existsSync(NATIVE_APP_DIR)) {
      console.log('❌ 네이티브 앱 디렉토리가 없습니다');
      return false;
    }
    
    // 인증 관련 파일 확인
    const authFiles = [
      'lib/auth-client.ts',
      'app/_layout.tsx',
      'app/(auth)/login.tsx',
      'app/(auth)/register.tsx'
    ];
    
    const missingFiles = [];
    authFiles.forEach(file => {
      const filePath = path.join(NATIVE_APP_DIR, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    });
    
    if (missingFiles.length > 0) {
      console.log(`❌ 누락된 네이티브 앱 파일: ${missingFiles.join(', ')}`);
      return false;
    }
    
    // 환경 변수 설정 확인
    const envPath = path.join(NATIVE_APP_DIR, '.env');
    if (!fs.existsSync(envPath)) {
      console.log('⚠️ 네이티브 앱 .env 파일이 없습니다');
    } else {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (!envContent.includes('EXPO_PUBLIC_SERVER_URL')) {
        console.log('⚠️ EXPO_PUBLIC_SERVER_URL이 .env에 설정되지 않았습니다');
      }
      if (!envContent.includes('EXPO_PUBLIC_BYPASS_AUTH')) {
        console.log('⚠️ EXPO_PUBLIC_BYPASS_AUTH가 .env에 설정되지 않았습니다');
      }
    }
    
    console.log('✅ 네이티브 앱 인증 설정 검증 완료');
    return true;
    
  } catch (error) {
    console.log(`❌ 네이티브 앱 인증 설정 검증 실패: ${error.message}`);
    return false;
  }
}

// 인증 API 엔드포인트 테스트
async function testAuthEndpoints() {
  console.log('🧪 인증 API 엔드포인트 테스트 중...');
  
  const endpoints = [
    '/api/auth/session',
    '/api/auth/sign-in',
    '/api/auth/sign-up',
    '/api/auth/sign-out'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await new Promise((resolve, reject) => {
        const req = http.get(`${SERVER_URL}${endpoint}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });
      
      if (response.statusCode === 200 || response.statusCode === 401) {
        console.log(`✅ ${endpoint}: 응답 (${response.statusCode})`);
        results.push({ endpoint, success: true, statusCode: response.statusCode });
      } else {
        console.log(`❌ ${endpoint}: 실패 (${response.statusCode})`);
        results.push({ endpoint, success: false, statusCode: response.statusCode });
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint}: 오류 (${error.message})`);
      results.push({ endpoint, success: false, error: error.message });
    }
  }
  
  return results;
}

// BYPASS_AUTH 모드 검증
function validateBypassAuthMode() {
  console.log('🔓 BYPASS_AUTH 모드 검증 중...');
  
  const bypassAuth = process.env.EXPO_PUBLIC_BYPASS_AUTH;
  
  if (!bypassAuth) {
    console.log('❌ EXPO_PUBLIC_BYPASS_AUTH가 설정되지 않았습니다');
    return false;
  }
  
  if (bypassAuth.toLowerCase() === 'true') {
    console.log('✅ BYPASS_AUTH 모드가 활성화되어 있습니다 (인증 우회)');
    console.log('   - 모든 protectedProcedure가 publicProcedure로 작동합니다');
    console.log('   - 세션 검증이 우회됩니다');
    return true;
  } else if (bypassAuth.toLowerCase() === 'false') {
    console.log('✅ BYPASS_AUTH 모드가 비활성화되어 있습니다 (인증 필요)');
    console.log('   - 모든 protectedProcedure가 정상적으로 작동합니다');
    console.log('   - 세션 검증이 필요합니다');
    return true;
  } else {
    console.log(`❌ 잘못된 BYPASS_AUTH 값: ${bypassAuth} (예상: true/false)`);
    return false;
  }
}

// 세션 상태 시뮬레이션
function simulateSessionStates() {
  console.log('🎭 세션 상태 시뮬레이션 중...');
  
  const scenarios = [
    {
      name: '인증 우회 모드 (BYPASS_AUTH=true)',
      bypassAuth: true,
      session: null,
      expected: '인증 없이 접근 가능'
    },
    {
      name: '인증 필요 모드 (BYPASS_AUTH=false)',
      bypassAuth: false,
      session: null,
      expected: '인증 필요'
    },
    {
      name: '인증 필요 모드 + 유효한 세션',
      bypassAuth: false,
      session: { user: { id: '1', email: 'test@example.com' } },
      expected: '인증된 사용자로 접근 가능'
    }
  ];
  
  scenarios.forEach(scenario => {
    console.log(`\n📋 시나리오: ${scenario.name}`);
    console.log(`   BYPASS_AUTH: ${scenario.bypassAuth}`);
    console.log(`   세션: ${scenario.session ? '있음' : '없음'}`);
    console.log(`   예상 결과: ${scenario.expected}`);
    
    // 시뮬레이션 로직
    if (scenario.bypassAuth) {
      console.log('   ✅ 인증 우회: 모든 요청이 허용됩니다');
    } else if (scenario.session) {
      console.log('   ✅ 인증됨: protectedProcedure 접근 가능');
    } else {
      console.log('   ❌ 인증 필요: protectedProcedure 접근 불가');
    }
  });
}

// 문제 진단 및 해결
async function diagnoseAuthIssues() {
  console.log('🔍 인증 문제 진단 중...\n');
  
  const issues = [];
  const solutions = [];
  
  // 1. 환경 변수 검증
  if (!validateAuthEnvironment()) {
    issues.push('인증 관련 환경 변수에 문제가 있습니다.');
    solutions.push('환경 변수를 설정하세요: node scripts/setup-env.js');
  }
  
  console.log('');
  
  // 2. Better Auth 설정 검증
  if (!validateBetterAuthConfig()) {
    issues.push('Better Auth 설정에 문제가 있습니다.');
    solutions.push('Better Auth 설정을 확인하고 수정하세요.');
  }
  
  console.log('');
  
  // 3. 네이티브 앱 인증 설정 검증
  if (!validateNativeAuthConfig()) {
    issues.push('네이티브 앱 인증 설정에 문제가 있습니다.');
    solutions.push('네이티브 앱 인증 파일을 확인하고 수정하세요.');
  }
  
  console.log('');
  
  // 4. BYPASS_AUTH 모드 검증
  if (!validateBypassAuthMode()) {
    issues.push('BYPASS_AUTH 모드 설정에 문제가 있습니다.');
    solutions.push('EXPO_PUBLIC_BYPASS_AUTH를 true 또는 false로 설정하세요.');
  }
  
  console.log('');
  
  // 5. 인증 API 엔드포인트 테스트
  const authResults = await testAuthEndpoints();
  const failedAuth = authResults.filter(r => !r.success);
  
  if (failedAuth.length > 0) {
    issues.push(`${failedAuth.length}개의 인증 API 엔드포인트가 실패했습니다.`);
    solutions.push('인증 API 서버를 확인하고 수정하세요.');
  }
  
  console.log('');
  
  // 6. 세션 상태 시뮬레이션
  simulateSessionStates();
  
  return { issues, solutions, authResults };
}

// 결과 요약
function summarizeAuthResults(results) {
  console.log('📊 인증 상태 진단 결과:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  console.log(`총 인증 엔드포인트: ${total}개`);
  console.log(`✅ 성공: ${successful}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`성공률: ${((successful / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n실패한 인증 엔드포인트:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.endpoint}: ${result.error || `HTTP ${result.statusCode}`}`);
    });
  }
}

// 메인 실행
async function main() {
  try {
    console.log('🚀 인증 상태 진단 시작...\n');
    
    const { issues, solutions, authResults } = await diagnoseAuthIssues();
    
    console.log('\n' + '='.repeat(50));
    summarizeAuthResults(authResults);
    
    if (issues.length > 0) {
      console.log('\n⚠️ 발견된 문제:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      
      console.log('\n🔧 해결 방법:');
      solutions.forEach(solution => console.log(`  - ${solution}`));
    } else {
      console.log('\n🎉 모든 인증 설정이 정상 작동합니다!');
    }
    
    console.log('\n📋 인증 모드별 동작:');
    console.log('1. BYPASS_AUTH=true: 인증 없이 모든 기능 사용 가능');
    console.log('2. BYPASS_AUTH=false: 로그인 후 사용 가능');
    
    console.log('\n📋 다음 단계:');
    console.log('1. 네이티브 앱에서 테스트하세요: cd apps/native && npm start');
    console.log('2. 인증 모드에 따라 로그인 테스트하세요');
    
  } catch (error) {
    console.error('❌ 진단 실행 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { 
  validateAuthEnvironment, 
  validateBetterAuthConfig, 
  validateNativeAuthConfig, 
  testAuthEndpoints 
};

