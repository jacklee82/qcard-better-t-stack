#!/usr/bin/env node

/**
 * API Endpoints Test Script
 * API 엔드포인트 테스트 및 진단 스크립트
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

console.log('🔍 API 엔드포인트 테스트 시작...\n');

// 환경 설정
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';
const API_BASE = `${SERVER_URL}/api/trpc`;

// HTTP 요청 헬퍼
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Test-Script/1.0',
        ...options.headers
      },
      timeout: 10000 // 10초 타임아웃
    };
    
    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// API 엔드포인트 테스트
async function testEndpoint(endpoint, description, expectedStatus = 200) {
  console.log(`📡 테스트: ${description}`);
  console.log(`   URL: ${endpoint}`);
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(endpoint);
    const duration = Date.now() - startTime;
    
    console.log(`   상태: ${response.statusCode} (${duration}ms)`);
    
    if (response.statusCode === expectedStatus) {
      console.log(`   ✅ 성공`);
      
      if (response.data && response.data.result) {
        const result = response.data.result;
        if (Array.isArray(result.data)) {
          console.log(`   📊 데이터 개수: ${result.data.length}개`);
        } else if (result.data) {
          console.log(`   📊 응답 데이터: ${JSON.stringify(result.data).substring(0, 100)}...`);
        }
      }
      
      return { success: true, response, duration };
    } else {
      console.log(`   ❌ 실패 (예상: ${expectedStatus}, 실제: ${response.statusCode})`);
      if (response.rawData) {
        console.log(`   📄 응답: ${response.rawData.substring(0, 200)}...`);
      }
      return { success: false, response, duration };
    }
    
  } catch (error) {
    console.log(`   ❌ 오류: ${error.message}`);
    return { success: false, error: error.message, duration: 0 };
  }
}

// 모든 API 엔드포인트 테스트
async function testAllEndpoints() {
  console.log(`🌐 서버 URL: ${SERVER_URL}\n`);
  
  const tests = [
    {
      endpoint: `${API_BASE}/question.getAll`,
      description: '모든 문제 가져오기',
      expectedStatus: 200
    },
    {
      endpoint: `${API_BASE}/question.getRandom?input=${encodeURIComponent(JSON.stringify({ count: 5 }))}`,
      description: '랜덤 문제 가져오기 (5개)',
      expectedStatus: 200
    },
    {
      endpoint: `${API_BASE}/question.getCategories`,
      description: '카테고리 목록 가져오기',
      expectedStatus: 200
    },
    {
      endpoint: `${API_BASE}/question.getDifficulties`,
      description: '난이도 목록 가져오기',
      expectedStatus: 200
    },
    {
      endpoint: `${API_BASE}/question.getCount`,
      description: '전체 문제 개수',
      expectedStatus: 200
    },
    {
      endpoint: `${API_BASE}/question.checkHealth`,
      description: '데이터베이스 상태 확인',
      expectedStatus: 200
    },
    {
      endpoint: `${API_BASE}/question.checkIntegrity`,
      description: '데이터 무결성 검증',
      expectedStatus: 200
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.endpoint, test.description, test.expectedStatus);
    results.push({ ...test, ...result });
    console.log(''); // 빈 줄
  }
  
  return results;
}

// 서버 연결 테스트
async function testServerConnection() {
  console.log('🔌 서버 연결 테스트...');
  
  try {
    const response = await makeRequest(`${SERVER_URL}/health`);
    console.log(`✅ 서버 연결 성공: ${response.statusCode}`);
    return true;
  } catch (error) {
    console.log(`❌ 서버 연결 실패: ${error.message}`);
    return false;
  }
}

// tRPC 라우터 테스트
async function testTRPCRouter() {
  console.log('🔧 tRPC 라우터 테스트...');
  
  try {
    const response = await makeRequest(`${API_BASE}/question.getAll`);
    if (response.statusCode === 200) {
      console.log('✅ tRPC 라우터 정상 작동');
      return true;
    } else {
      console.log(`❌ tRPC 라우터 오류: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ tRPC 라우터 테스트 실패: ${error.message}`);
    return false;
  }
}

// 문제 진단 및 해결
async function diagnoseAPIIssues() {
  console.log('🔍 API 문제 진단 중...\n');
  
  const issues = [];
  const solutions = [];
  
  // 1. 서버 연결 테스트
  const serverConnected = await testServerConnection();
  if (!serverConnected) {
    issues.push('API 서버에 연결할 수 없습니다.');
    solutions.push('API 서버를 시작하세요: cd packages/api && npm run dev');
  }
  
  console.log('');
  
  // 2. tRPC 라우터 테스트
  const routerWorking = await testTRPCRouter();
  if (!routerWorking) {
    issues.push('tRPC 라우터가 정상 작동하지 않습니다.');
    solutions.push('tRPC 설정을 확인하고 서버를 재시작하세요.');
  }
  
  console.log('');
  
  // 3. API 엔드포인트 테스트
  const results = await testAllEndpoints();
  const failedTests = results.filter(r => !r.success);
  
  if (failedTests.length > 0) {
    issues.push(`${failedTests.length}개의 API 엔드포인트가 실패했습니다.`);
    solutions.push('실패한 엔드포인트를 확인하고 수정하세요.');
  }
  
  return { issues, solutions, results };
}

// 결과 요약
function summarizeResults(results) {
  console.log('📊 테스트 결과 요약:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  console.log(`총 테스트: ${total}개`);
  console.log(`✅ 성공: ${successful}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`성공률: ${((successful / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n실패한 테스트:');
    results.filter(r => !r.success).forEach(test => {
      console.log(`  - ${test.description}: ${test.error || '알 수 없는 오류'}`);
    });
  }
  
  console.log('\n평균 응답 시간:');
  const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
  console.log(`  ${avgDuration.toFixed(0)}ms`);
}

// 메인 실행
async function main() {
  try {
    console.log('🚀 API 엔드포인트 테스트 시작...\n');
    
    const { issues, solutions, results } = await diagnoseAPIIssues();
    
    console.log('\n' + '='.repeat(50));
    summarizeResults(results);
    
    if (issues.length > 0) {
      console.log('\n⚠️ 발견된 문제:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      
      console.log('\n🔧 해결 방법:');
      solutions.forEach(solution => console.log(`  - ${solution}`));
    } else {
      console.log('\n🎉 모든 API 엔드포인트가 정상 작동합니다!');
    }
    
    console.log('\n📋 다음 단계:');
    console.log('1. 실패한 엔드포인트가 있다면 수정하세요');
    console.log('2. 네이티브 앱에서 테스트하세요: cd apps/native && npm start');
    
  } catch (error) {
    console.error('❌ 테스트 실행 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { 
  testEndpoint, 
  testAllEndpoints, 
  testServerConnection, 
  testTRPCRouter 
};


