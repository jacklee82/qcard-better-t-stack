#!/usr/bin/env node

/**
 * JSON Parse Error Fix Script
 * JSON 파싱 오류 해결 스크립트
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 JSON 파싱 오류 해결 스크립트 시작...\n');

// 환경 설정
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';
const API_PACKAGE_DIR = path.join(process.cwd(), 'packages', 'api');
const NATIVE_APP_DIR = path.join(process.cwd(), 'apps', 'native');

// JSON 파싱 오류 진단
function diagnoseJSONParseError() {
  console.log('🔍 JSON 파싱 오류 진단 중...');
  
  const commonCauses = [
    {
      name: 'HTML 응답 반환',
      description: 'API가 JSON 대신 HTML을 반환하고 있습니다',
      solution: 'API 서버가 정상적으로 실행되고 있는지 확인하세요'
    },
    {
      name: '잘못된 Content-Type',
      description: '응답 헤더의 Content-Type이 application/json이 아닙니다',
      solution: 'API 응답 헤더를 확인하고 수정하세요'
    },
    {
      name: '서버 오류 페이지',
      description: '서버가 500 오류나 404 오류 페이지를 반환하고 있습니다',
      solution: '서버 로그를 확인하고 오류를 수정하세요'
    },
    {
      name: 'CORS 오류',
      description: 'CORS 정책으로 인해 잘못된 응답을 받고 있습니다',
      solution: 'CORS 설정을 확인하고 수정하세요'
    },
    {
      name: '프록시 오류',
      description: '프록시나 로드 밸런서가 잘못된 응답을 반환하고 있습니다',
      solution: '프록시 설정을 확인하세요'
    }
  ];
  
  console.log('📋 일반적인 JSON 파싱 오류 원인:');
  commonCauses.forEach((cause, index) => {
    console.log(`${index + 1}. ${cause.name}`);
    console.log(`   설명: ${cause.description}`);
    console.log(`   해결: ${cause.solution}`);
    console.log('');
  });
  
  return commonCauses;
}

// API 응답 테스트
async function testAPIResponse() {
  console.log('🧪 API 응답 테스트 중...');
  
  const endpoints = [
    '/api/trpc/health.ping',
    '/api/trpc/question.getAll',
    '/api/trpc/question.getCategories'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await new Promise((resolve, reject) => {
        const req = http.get(`${SERVER_URL}${endpoint}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ 
            statusCode: res.statusCode, 
            headers: res.headers,
            data: data 
          }));
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });
      
      console.log(`\n📡 ${endpoint} 테스트 결과:`);
      console.log(`   상태 코드: ${response.statusCode}`);
      console.log(`   Content-Type: ${response.headers['content-type'] || '없음'}`);
      console.log(`   응답 길이: ${response.data.length} bytes`);
      
      // 응답 내용 분석
      if (response.data.startsWith('<')) {
        console.log('   ❌ HTML 응답 감지 (JSON 파싱 오류 원인)');
        console.log(`   응답 내용 (처음 200자): ${response.data.substring(0, 200)}...}`);
        results.push({ endpoint, success: false, type: 'html_response', data: response.data });
      } else if (response.data.startsWith('{') || response.data.startsWith('[')) {
        console.log('   ✅ JSON 응답 감지');
        try {
          JSON.parse(response.data);
          console.log('   ✅ JSON 파싱 성공');
          results.push({ endpoint, success: true, type: 'json_response' });
        } catch (parseError) {
          console.log('   ❌ JSON 파싱 실패');
          console.log(`   파싱 오류: ${parseError.message}`);
          results.push({ endpoint, success: false, type: 'json_parse_error', error: parseError.message });
        }
      } else {
        console.log('   ⚠️ 알 수 없는 응답 형식');
        console.log(`   응답 내용 (처음 200자): ${response.data.substring(0, 200)}...`);
        results.push({ endpoint, success: false, type: 'unknown_response', data: response.data });
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint}: 연결 실패 (${error.message})`);
      results.push({ endpoint, success: false, type: 'connection_error', error: error.message });
    }
  }
  
  return results;
}

// API 서버 상태 확인
function checkAPIServerStatus() {
  console.log('🔍 API 서버 상태 확인 중...');
  
  try {
    // API 서버 프로세스 확인
    const processes = execSync('ps aux | grep -E "(node|npm|next)" | grep -v grep', { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    if (processes.includes('3000') || processes.includes('3001')) {
      console.log('✅ API 서버 프로세스가 실행 중입니다');
      return true;
    } else {
      console.log('❌ API 서버 프로세스가 실행되지 않았습니다');
      return false;
    }
  } catch (error) {
    console.log('❌ API 서버 상태 확인 실패');
    console.log('   오류:', error.message);
    return false;
  }
}

// API 서버 시작
function startAPIServer() {
  console.log('🚀 API 서버 시작 중...');
  
  try {
    // API 서버 디렉토리로 이동하여 서버 시작
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: API_PACKAGE_DIR,
      stdio: 'pipe',
      shell: true,
      detached: true
    });
    
    console.log('✅ API 서버 시작 명령 실행됨');
    console.log('   잠시 후 서버가 시작될 것입니다...');
    
    return true;
  } catch (error) {
    console.log('❌ API 서버 시작 실패');
    console.log('   오류:', error.message);
    return false;
  }
}

// CORS 설정 확인
function checkCORSSettings() {
  console.log('🔍 CORS 설정 확인 중...');
  
  try {
    // API 패키지의 CORS 설정 확인
    const apiFiles = [
      'src/index.ts',
      'src/context.ts',
      'package.json'
    ];
    
    let corsConfigured = false;
    
    apiFiles.forEach(file => {
      const filePath = path.join(API_PACKAGE_DIR, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('cors') || content.includes('CORS') || content.includes('trustedOrigins')) {
          console.log(`✅ ${file}에서 CORS 설정 발견`);
          corsConfigured = true;
        }
      }
    });
    
    if (!corsConfigured) {
      console.log('⚠️ CORS 설정이 명시적으로 확인되지 않았습니다');
    }
    
    return corsConfigured;
  } catch (error) {
    console.log('❌ CORS 설정 확인 실패');
    console.log('   오류:', error.message);
    return false;
  }
}

// 네이티브 앱 설정 확인
function checkNativeAppSettings() {
  console.log('📱 네이티브 앱 설정 확인 중...');
  
  try {
    // 환경 변수 확인
    const envPath = path.join(NATIVE_APP_DIR, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✅ .env 파일 존재');
      
      if (envContent.includes('EXPO_PUBLIC_SERVER_URL')) {
        console.log('✅ EXPO_PUBLIC_SERVER_URL 설정됨');
      } else {
        console.log('❌ EXPO_PUBLIC_SERVER_URL 설정되지 않음');
      }
    } else {
      console.log('❌ .env 파일이 없습니다');
    }
    
    // tRPC 클라이언트 설정 확인
    const trpcPath = path.join(NATIVE_APP_DIR, 'utils', 'trpc.ts');
    if (fs.existsSync(trpcPath)) {
      const trpcContent = fs.readFileSync(trpcPath, 'utf8');
      if (trpcContent.includes('httpBatchLink')) {
        console.log('✅ tRPC 클라이언트 설정 확인됨');
      } else {
        console.log('⚠️ tRPC 클라이언트 설정이 표준과 다릅니다');
      }
    } else {
      console.log('❌ tRPC 클라이언트 파일이 없습니다');
    }
    
    return true;
  } catch (error) {
    console.log('❌ 네이티브 앱 설정 확인 실패');
    console.log('   오류:', error.message);
    return false;
  }
}

// JSON 파싱 오류 해결
async function fixJSONParseError() {
  console.log('🔧 JSON 파싱 오류 해결 중...\n');
  
  const issues = [];
  const solutions = [];
  
  // 1. API 서버 상태 확인
  if (!checkAPIServerStatus()) {
    issues.push('API 서버가 실행되지 않았습니다.');
    solutions.push('API 서버를 시작하세요: cd packages/api && npm run dev');
    
    if (startAPIServer()) {
      console.log('✅ API 서버 시작 시도됨');
    } else {
      console.log('❌ API 서버 시작 실패');
    }
  }
  
  console.log('');
  
  // 2. API 응답 테스트
  const apiResults = await testAPIResponse();
  const failedResponses = apiResults.filter(r => !r.success);
  
  if (failedResponses.length > 0) {
    issues.push(`${failedResponses.length}개의 API 엔드포인트에서 응답 문제가 발생했습니다.`);
    
    failedResponses.forEach(result => {
      if (result.type === 'html_response') {
        solutions.push(`${result.endpoint}: HTML 응답을 JSON으로 변경하세요`);
      } else if (result.type === 'json_parse_error') {
        solutions.push(`${result.endpoint}: JSON 형식을 수정하세요`);
      } else if (result.type === 'connection_error') {
        solutions.push(`${result.endpoint}: 서버 연결을 확인하세요`);
      }
    });
  }
  
  console.log('');
  
  // 3. CORS 설정 확인
  if (!checkCORSSettings()) {
    issues.push('CORS 설정이 올바르지 않을 수 있습니다.');
    solutions.push('CORS 설정을 확인하고 수정하세요');
  }
  
  console.log('');
  
  // 4. 네이티브 앱 설정 확인
  if (!checkNativeAppSettings()) {
    issues.push('네이티브 앱 설정에 문제가 있습니다.');
    solutions.push('네이티브 앱 설정을 확인하고 수정하세요');
  }
  
  return { issues, solutions, apiResults };
}

// 결과 요약
function summarizeResults(issues, solutions, apiResults) {
  console.log('📊 JSON 파싱 오류 해결 결과:');
  console.log('='.repeat(50));
  
  if (issues.length === 0) {
    console.log('🎉 모든 JSON 파싱 오류가 해결되었습니다!');
  } else {
    console.log(`⚠️ 발견된 문제: ${issues.length}개`);
    issues.forEach(issue => console.log(`  - ${issue}`));
    
    console.log('\n🔧 해결 방법:');
    solutions.forEach(solution => console.log(`  - ${solution}`));
  }
  
  console.log('\n📋 API 응답 테스트 결과:');
  const successful = apiResults.filter(r => r.success).length;
  const failed = apiResults.filter(r => !r.success).length;
  console.log(`  ✅ 성공: ${successful}개`);
  console.log(`  ❌ 실패: ${failed}개`);
  
  if (failed > 0) {
    console.log('\n실패한 엔드포인트:');
    apiResults.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.endpoint}: ${result.type}`);
    });
  }
  
  console.log('\n📋 다음 단계:');
  console.log('1. API 서버 시작: cd packages/api && npm run dev');
  console.log('2. 네이티브 앱 시작: cd apps/native && npm start');
  console.log('3. JSON 파싱 오류가 해결되었는지 확인');
}

// 메인 실행
async function main() {
  try {
    console.log('🚀 JSON 파싱 오류 해결 시작...\n');
    
    // 일반적인 원인 설명
    diagnoseJSONParseError();
    
    const { issues, solutions, apiResults } = await fixJSONParseError();
    
    console.log('\n' + '='.repeat(50));
    summarizeResults(issues, solutions, apiResults);
    
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
  diagnoseJSONParseError, 
  testAPIResponse, 
  checkAPIServerStatus, 
  fixJSONParseError 
};
