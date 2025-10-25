/**
 * Environment Configuration
 * 환경변수 설정 및 검증
 */

// 환경변수 기본값 설정
const config = {
  // API 서버 URL
  SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000',
  
  // 인증 우회 설정
  BYPASS_AUTH: (process.env.EXPO_PUBLIC_BYPASS_AUTH ?? 'true') === 'true',
  
  // 개발 모드
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // 데이터베이스 URL (서버에서 사용)
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/qcard_db',
};

// 환경변수 검증
export function validateEnvironment() {
  const errors: string[] = [];
  
  // SERVER_URL 검증
  if (!config.SERVER_URL) {
    errors.push('EXPO_PUBLIC_SERVER_URL이 설정되지 않았습니다.');
  } else if (!config.SERVER_URL.startsWith('http')) {
    errors.push('EXPO_PUBLIC_SERVER_URL은 http:// 또는 https://로 시작해야 합니다.');
  }
  
  // BYPASS_AUTH 검증
  if (typeof config.BYPASS_AUTH !== 'boolean') {
    errors.push('EXPO_PUBLIC_BYPASS_AUTH는 true 또는 false여야 합니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    config
  };
}

// 환경변수 정보 출력
export function logEnvironmentInfo() {
  console.log('🔧 환경변수 설정:');
  console.log(`  SERVER_URL: ${config.SERVER_URL}`);
  console.log(`  BYPASS_AUTH: ${config.BYPASS_AUTH}`);
  console.log(`  NODE_ENV: ${config.NODE_ENV}`);
  
  const validation = validateEnvironment();
  if (!validation.isValid) {
    console.error('❌ 환경변수 오류:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  } else {
    console.log('✅ 환경변수 설정이 올바릅니다.');
  }
}

export default config;

