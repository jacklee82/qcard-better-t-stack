#!/usr/bin/env node

/**
 * Authentication Fix Script
 * 인증 문제 해결 스크립트
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🔧 인증 문제 해결 스크립트 시작...\n');

// 환경 설정
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';
const AUTH_PACKAGE_DIR = path.join(process.cwd(), 'packages', 'auth');
const NATIVE_APP_DIR = path.join(process.cwd(), 'apps', 'native');

// 환경 변수 자동 설정
function setupAuthEnvironment() {
  console.log('🔧 인증 환경 변수 자동 설정 중...');
  
  const envFiles = [
    {
      path: path.join(process.cwd(), 'packages', 'api', '.env'),
      content: `BETTER_AUTH_SECRET=your-secret-key-here-${Date.now()}
CORS_ORIGIN=http://localhost:3000
VERCEL_URL=localhost:3000
`
    },
    {
      path: path.join(NATIVE_APP_DIR, '.env'),
      content: `EXPO_PUBLIC_SERVER_URL=http://localhost:3000
EXPO_PUBLIC_BYPASS_AUTH=true
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
      
      // .env 파일이 없으면 생성
      if (!fs.existsSync(envFile.path)) {
        fs.writeFileSync(envFile.path, envFile.content);
        console.log(`✅ ${envFile.path} 생성됨`);
      } else {
        console.log(`⚠️ ${envFile.path} 이미 존재함`);
      }
    } catch (error) {
      console.log(`❌ ${envFile.path} 생성 실패: ${error.message}`);
    }
  });
}

// Better Auth 설정 검증 및 수정
function fixBetterAuthConfig() {
  console.log('🔧 Better Auth 설정 검증 및 수정 중...');
  
  try {
    // auth 패키지 디렉토리 확인
    if (!fs.existsSync(AUTH_PACKAGE_DIR)) {
      console.log('❌ auth 패키지 디렉토리가 없습니다');
      return false;
    }
    
    // package.json 확인
    const packageJsonPath = path.join(AUTH_PACKAGE_DIR, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log('❌ auth package.json이 없습니다');
      return false;
    }
    
    // TypeScript 컴파일 검증
    console.log('🔍 TypeScript 컴파일 검증 중...');
    try {
      execSync('npx tsc --noEmit', { cwd: AUTH_PACKAGE_DIR, stdio: 'pipe' });
      console.log('✅ Better Auth TypeScript 컴파일 성공');
    } catch (error) {
      console.log('❌ Better Auth TypeScript 컴파일 실패');
      console.log('   오류:', error.message);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Better Auth 설정 수정 실패: ${error.message}`);
    return false;
  }
}

// 네이티브 앱 인증 설정 수정
function fixNativeAuthConfig() {
  console.log('🔧 네이티브 앱 인증 설정 수정 중...');
  
  try {
    // 네이티브 앱 디렉토리 확인
    if (!fs.existsSync(NATIVE_APP_DIR)) {
      console.log('❌ 네이티브 앱 디렉토리가 없습니다');
      return false;
    }
    
    // 인증 관련 파일 확인 및 생성
    const authFiles = [
      {
        path: 'lib/auth-client.ts',
        content: `import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

export const authClient = createAuthClient({
	baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
	fetchOptions: {
		headers: {
			"Origin": Constants.expoConfig?.scheme 
				? \`\${Constants.expoConfig.scheme}://\` 
				: "mybettertapp://",
		},
	},
	plugins: [
		expoClient({
			scheme: Constants.expoConfig?.scheme as string,
			storagePrefix: Constants.expoConfig?.scheme as string,
			storage: SecureStore,
		}),
	],
});`
      },
      {
        path: 'app/(auth)/login.tsx',
        content: `import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { authClient } from '@/lib/auth-client';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        Alert.alert('로그인 실패', result.error.message);
      } else {
        Alert.alert('성공', '로그인되었습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-6">
      <Text className="text-2xl font-bold mb-8">로그인</Text>
      
      <TextInput
        className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        className="w-full p-3 border border-gray-300 rounded-lg mb-6"
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity
        className="w-full bg-blue-500 p-3 rounded-lg"
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text className="text-white text-center font-medium">
          {isLoading ? '로그인 중...' : '로그인'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}`
      }
    ];
    
    authFiles.forEach(file => {
      const filePath = path.join(NATIVE_APP_DIR, file.path);
      const dir = path.dirname(filePath);
      
      // 디렉토리 생성
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 파일이 없으면 생성
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, file.content);
        console.log(`✅ ${file.path} 생성됨`);
      } else {
        console.log(`⚠️ ${file.path} 이미 존재함`);
      }
    });
    
    return true;
    
  } catch (error) {
    console.log(`❌ 네이티브 앱 인증 설정 수정 실패: ${error.message}`);
    return false;
  }
}

// 인증 모드 설정
function configureAuthMode() {
  console.log('🔧 인증 모드 설정 중...');
  
  const bypassAuth = process.env.EXPO_PUBLIC_BYPASS_AUTH;
  
  if (bypassAuth?.toLowerCase() === 'true') {
    console.log('✅ BYPASS_AUTH 모드가 활성화되어 있습니다');
    console.log('   - 모든 protectedProcedure가 publicProcedure로 작동합니다');
    console.log('   - 세션 검증이 우회됩니다');
    console.log('   - 개발 모드에서 사용하기 적합합니다');
    return true;
  } else if (bypassAuth?.toLowerCase() === 'false') {
    console.log('✅ BYPASS_AUTH 모드가 비활성화되어 있습니다');
    console.log('   - 모든 protectedProcedure가 정상적으로 작동합니다');
    console.log('   - 세션 검증이 필요합니다');
    console.log('   - 프로덕션 모드에서 사용하기 적합합니다');
    return true;
  } else {
    console.log('⚠️ EXPO_PUBLIC_BYPASS_AUTH가 설정되지 않았습니다');
    console.log('   기본값으로 true를 사용합니다');
    return false;
  }
}

// 인증 API 테스트
async function testAuthAPI() {
  console.log('🧪 인증 API 테스트 중...');
  
  const endpoints = [
    '/api/auth/session',
    '/api/auth/sign-in',
    '/api/auth/sign-up'
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

// 문제 진단 및 해결
async function diagnoseAndFix() {
  console.log('🔍 인증 문제 진단 및 해결 중...\n');
  
  const issues = [];
  const solutions = [];
  
  // 1. 환경 변수 설정
  setupAuthEnvironment();
  
  console.log('');
  
  // 2. Better Auth 설정 수정
  if (!fixBetterAuthConfig()) {
    issues.push('Better Auth 설정에 문제가 있습니다.');
    solutions.push('Better Auth 설정을 확인하고 수정하세요.');
  }
  
  console.log('');
  
  // 3. 네이티브 앱 인증 설정 수정
  if (!fixNativeAuthConfig()) {
    issues.push('네이티브 앱 인증 설정에 문제가 있습니다.');
    solutions.push('네이티브 앱 인증 파일을 확인하고 수정하세요.');
  }
  
  console.log('');
  
  // 4. 인증 모드 설정
  if (!configureAuthMode()) {
    issues.push('인증 모드 설정에 문제가 있습니다.');
    solutions.push('EXPO_PUBLIC_BYPASS_AUTH를 true 또는 false로 설정하세요.');
  }
  
  console.log('');
  
  // 5. 인증 API 테스트
  const authResults = await testAuthAPI();
  const failedAuth = authResults.filter(r => !r.success);
  
  if (failedAuth.length > 0) {
    issues.push(`${failedAuth.length}개의 인증 API 엔드포인트가 실패했습니다.`);
    solutions.push('인증 API 서버를 확인하고 수정하세요.');
  }
  
  return { issues, solutions, authResults };
}

// 결과 요약
function summarizeAuthResults(results) {
  console.log('📊 인증 문제 해결 결과:');
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
    console.log('🚀 인증 문제 해결 시작...\n');
    
    const { issues, solutions, authResults } = await diagnoseAndFix();
    
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
    console.log('1. API 서버 시작: cd packages/api && npm run dev');
    console.log('2. 네이티브 앱 시작: cd apps/native && npm start');
    console.log('3. 인증 모드에 따라 로그인 테스트');
    
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
  setupAuthEnvironment, 
  fixBetterAuthConfig, 
  fixNativeAuthConfig, 
  testAuthAPI 
};

