# 환경변수 설정 가이드

## 문제 해결: "문제를 찾을 수 없습니다"

### 원인: 환경변수 설정 문제

네이티브 앱에서 문제를 찾을 수 없는 주요 원인은 환경변수가 제대로 설정되지 않았기 때문입니다.

## 해결 방법

### 1. .env 파일 생성

`my-better-t-app/apps/native/.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# API 서버 URL
EXPO_PUBLIC_SERVER_URL=http://localhost:3000

# 인증 우회 설정 (개발용)
EXPO_PUBLIC_BYPASS_AUTH=true

# 데이터베이스 URL (서버에서 사용)
DATABASE_URL=postgresql://postgres:password@localhost:5432/qcard_db

# 개발 모드 설정
NODE_ENV=development
```

### 2. 환경변수 검증

앱이 시작될 때 콘솔에서 다음 메시지를 확인하세요:

```
🔧 환경변수 설정:
  SERVER_URL: http://localhost:3000
  BYPASS_AUTH: true
  NODE_ENV: development
✅ 환경변수 설정이 올바릅니다.
```

### 3. 문제 해결 체크리스트

#### ✅ API 서버 실행 확인
```bash
# API 서버가 실행 중인지 확인
curl http://localhost:3000/api/trpc/question.getAll
```

#### ✅ 데이터베이스 연결 확인
```bash
# 데이터베이스에 문제 데이터가 있는지 확인
psql $DATABASE_URL -c "SELECT COUNT(*) FROM questions;"
```

#### ✅ 시드 데이터 실행
```bash
# 데이터베이스에 문제 데이터 삽입
cd packages/db && npm run seed
```

### 4. 일반적인 오류와 해결책

#### 오류: "EXPO_PUBLIC_SERVER_URL이 설정되지 않았습니다"
**해결책**: `.env` 파일에 `EXPO_PUBLIC_SERVER_URL=http://localhost:3000` 추가

#### 오류: "API 서버에 연결할 수 없습니다"
**해결책**: 
1. API 서버가 실행 중인지 확인: `cd packages/api && npm run dev`
2. 포트 3000이 사용 가능한지 확인: `netstat -an | grep 3000`

#### 오류: "데이터베이스에 문제가 없습니다"
**해결책**:
1. 데이터베이스 서버 실행: `pg_ctl start`
2. 시드 데이터 실행: `cd packages/db && npm run seed`

### 5. 개발 환경 설정

#### 필요한 서비스들:
1. **PostgreSQL 데이터베이스** (포트 5432)
2. **API 서버** (포트 3000)
3. **Expo 개발 서버** (포트 8081)

#### 실행 순서:
```bash
# 1. 데이터베이스 서버 시작
pg_ctl start

# 2. API 서버 시작
cd packages/api && npm run dev

# 3. 네이티브 앱 시작
cd apps/native && npm start
```

### 6. 환경변수 참조

#### 네이티브 앱에서 사용되는 환경변수:
- `EXPO_PUBLIC_SERVER_URL`: API 서버 URL
- `EXPO_PUBLIC_BYPASS_AUTH`: 인증 우회 여부
- `NODE_ENV`: 개발/프로덕션 모드

#### 서버에서 사용되는 환경변수:
- `DATABASE_URL`: 데이터베이스 연결 문자열
- `NODE_ENV`: 개발/프로덕션 모드

### 7. 디버깅 팁

#### 환경변수 확인:
```typescript
// 앱에서 환경변수 확인
console.log('SERVER_URL:', process.env.EXPO_PUBLIC_SERVER_URL);
console.log('BYPASS_AUTH:', process.env.EXPO_PUBLIC_BYPASS_AUTH);
```

#### 네트워크 요청 확인:
```typescript
// tRPC 요청 상태 확인
const { data, isLoading, error } = trpc.question.getAll.useQuery();
console.log('Questions:', data);
console.log('Loading:', isLoading);
console.log('Error:', error);
```

### 8. 완전한 설정 예시

#### .env 파일 (apps/native/.env):
```bash
EXPO_PUBLIC_SERVER_URL=http://localhost:3000
EXPO_PUBLIC_BYPASS_AUTH=true
NODE_ENV=development
```

#### .env 파일 (packages/api/.env):
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/qcard_db
NODE_ENV=development
```

이 설정을 완료하면 "문제를 찾을 수 없습니다" 오류가 해결됩니다.


