# Database Package

Drizzle ORM을 사용한 PostgreSQL 데이터베이스 스키마 및 마이그레이션 관리

## 환경 설정

1. `.env` 파일 생성 (root 또는 apps/web)
```bash
cp .env.example .env
```

2. Supabase 정보 입력
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
```

## 사용법

### 1. 마이그레이션 생성
스키마 변경 후 마이그레이션 파일 생성:
```bash
bun run db:generate
```

### 2. 마이그레이션 실행
```bash
bun run db:migrate
```

### 3. 개발 중 빠른 동기화
프로덕션 마이그레이션 없이 DB 직접 업데이트:
```bash
bun run db:push
```

### 4. 초기 데이터 시딩
all-questions.json → questions 테이블:
```bash
bun run seed
```

### 5. DB 스튜디오 (GUI)
```bash
bun run db:studio
```

## 스키마 구조

### Auth 테이블 (Better Auth)
- `user` - 사용자 정보
- `session` - 세션
- `account` - OAuth 계정
- `verification` - 인증 토큰

### App 테이블
- `questions` - 문제 데이터
- `user_progress` - 사용자 진행 상황
- `study_sessions` - 학습 세션
- `bookmarks` - 북마크
- `user_stats` - 통계 캐싱

## 개발 플로우

```bash
# 1. 스키마 수정
# src/schema/*.ts 파일 편집

# 2. DB 동기화 (개발)
bun run db:push

# 3. 초기 데이터 로드
bun run seed

# 4. 확인
bun run db:studio
```

## 프로덕션 마이그레이션

```bash
# 1. 마이그레이션 생성
bun run db:generate

# 2. 검토
# src/migrations/*.sql 확인

# 3. 적용
bun run db:migrate
```

## 트러블슈팅

### "relation does not exist" 에러
```bash
bun run db:push
```

### 시딩 실패
1. DATABASE_URL 확인
2. all-questions.json 경로 확인
3. questions 테이블 존재 여부 확인

### 마이그레이션 충돌
```bash
# 마이그레이션 폴더 클리어 후 재생성
rm -rf src/migrations/*
bun run db:generate
```



