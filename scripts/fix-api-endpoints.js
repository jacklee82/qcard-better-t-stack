#!/usr/bin/env node

/**
 * API Endpoints Fix Script
 * API 엔드포인트 문제 해결 스크립트
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🔧 API 엔드포인트 문제 해결 스크립트 시작...\n');

// 환경 설정
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';
const API_PACKAGE_DIR = path.join(process.cwd(), 'packages', 'api');
const NATIVE_APP_DIR = path.join(process.cwd(), 'apps', 'native');

// 서버 상태 확인
function checkServerStatus() {
  console.log('🔍 API 서버 상태 확인 중...');
  
  return new Promise((resolve) => {
    const req = http.get(`${SERVER_URL}/api/trpc/health.ping`, (res) => {
      console.log(`✅ API 서버 응답: ${res.statusCode}`);
      resolve({ running: true, statusCode: res.statusCode });
    });
    
    req.on('error', (error) => {
      console.log(`❌ API 서버 연결 실패: ${error.message}`);
      resolve({ running: false, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ API 서버 응답 시간 초과');
      req.destroy();
      resolve({ running: false, error: 'timeout' });
    });
  });
}

// API 서버 시작
function startAPIServer() {
  console.log('🚀 API 서버 시작 중...');
  
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: API_PACKAGE_DIR,
      stdio: 'pipe',
      shell: true
    });
    
    let serverReady = false;
    let attempts = 0;
    const maxAttempts = 30; // 30초 대기
    
    const checkServer = setInterval(async () => {
      attempts++;
      console.log(`⏳ 서버 시작 대기 중... (${attempts}/${maxAttempts})`);
      
      const status = await checkServerStatus();
      if (status.running) {
        serverReady = true;
        clearInterval(checkServer);
        console.log('✅ API 서버가 성공적으로 시작되었습니다!');
        resolve(serverProcess);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkServer);
        serverProcess.kill();
        reject(new Error('API 서버 시작 시간 초과'));
      }
    }, 1000);
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running') || output.includes('listening')) {
        console.log('📡 서버 시작 메시지 감지');
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error('❌ 서버 오류:', data.toString());
    });
    
    serverProcess.on('error', (error) => {
      clearInterval(checkServer);
      reject(error);
    });
  });
}

// tRPC 라우터 검증
function validateTRPCRouter() {
  console.log('🔧 tRPC 라우터 검증 중...');
  
  try {
    // 라우터 파일 존재 확인
    const routerFiles = [
      'src/routers/index.ts',
      'src/routers/question.ts',
      'src/routers/health.ts',
      'src/routers/progress.ts',
      'src/routers/session.ts'
    ];
    
    const missingFiles = [];
    routerFiles.forEach(file => {
      const filePath = path.join(API_PACKAGE_DIR, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    });
    
    if (missingFiles.length > 0) {
      console.log(`❌ 누락된 라우터 파일: ${missingFiles.join(', ')}`);
      return false;
    }
    
    console.log('✅ 모든 라우터 파일이 존재합니다');
    
    // TypeScript 컴파일 검증
    console.log('🔍 TypeScript 컴파일 검증 중...');
    execSync('npx tsc --noEmit', { cwd: API_PACKAGE_DIR, stdio: 'pipe' });
    console.log('✅ TypeScript 컴파일 성공');
    
    return true;
    
  } catch (error) {
    console.log(`❌ tRPC 라우터 검증 실패: ${error.message}`);
    return false;
  }
}

// 환경 변수 검증
function validateEnvironmentVariables() {
  console.log('🔍 환경 변수 검증 중...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'EXPO_PUBLIC_SERVER_URL'
  ];
  
  const missingVars = [];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log(`❌ 누락된 환경 변수: ${missingVars.join(', ')}`);
    return false;
  }
  
  console.log('✅ 모든 필수 환경 변수가 설정되었습니다');
  return true;
}

// API 엔드포인트 테스트
async function testAPIEndpoints() {
  console.log('🧪 API 엔드포인트 테스트 중...');
  
  const endpoints = [
    '/api/trpc/health.ping',
    '/api/trpc/question.getAll',
    '/api/trpc/question.getCategories',
    '/api/trpc/question.checkHealth'
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
      
      if (response.statusCode === 200) {
        console.log(`✅ ${endpoint}: 성공`);
        results.push({ endpoint, success: true });
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

// 문제 진단 및 해결
async function diagnoseAndFix() {
  console.log('🔍 API 엔드포인트 문제 진단 중...\n');
  
  const issues = [];
  const solutions = [];
  
  // 1. 환경 변수 검증
  if (!validateEnvironmentVariables()) {
    issues.push('필수 환경 변수가 설정되지 않았습니다.');
    solutions.push('환경 변수를 설정하세요: node scripts/setup-env.js');
  }
  
  console.log('');
  
  // 2. tRPC 라우터 검증
  if (!validateTRPCRouter()) {
    issues.push('tRPC 라우터에 문제가 있습니다.');
    solutions.push('라우터 파일을 확인하고 TypeScript 오류를 수정하세요.');
  }
  
  console.log('');
  
  // 3. 서버 상태 확인
  const serverStatus = await checkServerStatus();
  if (!serverStatus.running) {
    issues.push('API 서버가 실행되지 않았습니다.');
    solutions.push('API 서버를 시작하세요: cd packages/api && npm run dev');
    
    console.log('🔧 API 서버를 자동으로 시작합니다...');
    try {
      await startAPIServer();
      console.log('✅ API 서버 시작 성공!');
    } catch (error) {
      console.log(`❌ API 서버 시작 실패: ${error.message}`);
      solutions.push('수동으로 API 서버를 시작하세요: cd packages/api && npm run dev');
    }
  }
  
  console.log('');
  
  // 4. API 엔드포인트 테스트
  const endpointResults = await testAPIEndpoints();
  const failedEndpoints = endpointResults.filter(r => !r.success);
  
  if (failedEndpoints.length > 0) {
    issues.push(`${failedEndpoints.length}개의 API 엔드포인트가 실패했습니다.`);
    solutions.push('실패한 엔드포인트를 확인하고 수정하세요.');
  }
  
  return { issues, solutions, endpointResults };
}

// 결과 요약
function summarizeResults(results) {
  console.log('📊 API 엔드포인트 테스트 결과:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  console.log(`총 엔드포인트: ${total}개`);
  console.log(`✅ 성공: ${successful}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`성공률: ${((successful / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n실패한 엔드포인트:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.endpoint}: ${result.error || `HTTP ${result.statusCode}`}`);
    });
  }
}

// 메인 실행
async function main() {
  try {
    console.log('🚀 API 엔드포인트 문제 해결 시작...\n');
    
    const { issues, solutions, endpointResults } = await diagnoseAndFix();
    
    console.log('\n' + '='.repeat(50));
    summarizeResults(endpointResults);
    
    if (issues.length > 0) {
      console.log('\n⚠️ 발견된 문제:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      
      console.log('\n🔧 해결 방법:');
      solutions.forEach(solution => console.log(`  - ${solution}`));
    } else {
      console.log('\n🎉 모든 API 엔드포인트가 정상 작동합니다!');
    }
    
    console.log('\n📋 다음 단계:');
    console.log('1. 네이티브 앱에서 테스트하세요: cd apps/native && npm start');
    console.log('2. 문제가 지속되면 로그를 확인하세요');
    
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
  checkServerStatus, 
  startAPIServer, 
  validateTRPCRouter, 
  testAPIEndpoints 
};

