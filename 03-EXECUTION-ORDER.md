# Phase 1 완성 - 실행 순서

## 📋 준비된 문서

1. **01-DB-SCHEMA-SETUP.md** - DB 스키마 파일 5개
2. **02-API-ROUTERS-SETUP.md** - API 라우터 파일 3개
3. **03-EXECUTION-ORDER.md** - 이 문서

---

## 🚀 정확한 실행 순서

### Step 1: DB 스키마 파일 생성 (5개)

위치: `packages/db/src/schema/`

아래 파일을 **01-DB-SCHEMA-SETUP.md**에서 복사하여 생성:

1. ✅ `users.ts`
2. ✅ `decks.ts`
3. ✅ `cards.ts`
4. ✅ `progress.ts`
5. ✅ `index.ts`

```bash
# 확인 명령어
ls packages/db/src/schema/
# users.ts, decks.ts, cards.ts, progress.ts, index.ts, auth.ts 가 있어야 함
```

---

### Step 2: DB 마이그레이션 생성 및 적용

```bash
# Step 2-1: 마이그레이션 파일 생성
cd packages/db
bun db:generate

# 출력 확인:
# ✓ Generated migrations in ./src/migrations
# 생성된 파일: src/migrations/0001_initial.sql (또는 유사)

# Step 2-2: Supabase에 적용
bun db:push

# 출력 확인:
# ✓ Created table "users"
# ✓ Created table "decks"
# ✓ Created table "cards"
# ✓ Created table "progress"
# ✓ Created table "sessions"
# ✓ Created table "accounts"
# ✓ Created table "verification_tokens"
```

**Supabase에서 확인:**
```sql
-- Supabase Dashboard > SQL Editor에서 실행
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- 결과:
-- accounts
-- cards
-- decks
-- progress
-- sessions
-- users
-- verification_tokens
```

---

### Step 3: API 라우터 파일 생성 (3개)

위치: `packages/api/src/routers/`

아래 파일을 **02-API-ROUTERS-SETUP.md**에서 복사하여 생성:

1. ✅ `question.ts`
2. ✅ `progress.ts`
3. ✅ `stats.ts`

(routers/index.ts는 이미 준비됨)

```bash
# 확인 명령어
ls packages/api/src/routers/
# question.ts, progress.ts, stats.ts, index.ts 가 있어야 함
```

---

### Step 4: 타입 체크

```bash
# Root 디렉토리에서 실행
bun check-types
```

**성공 출력:**
```
turbo 2.5.8

• Packages in scope: @my-better-t-app/api, @my-better-t-app/auth, @my-better-t-app/db, native, web
• Running check-types in 5 packages
✓ [5/5] Packages completed successfully
```

---

### Step 5: 개발 서버 시작

```bash
# Step 5-1: 웹 서버 시작
bun dev:web

# 출력 확인:
# ▲ Next.js 16.0.0
# - Local: http://localhost:3001

# Step 5-2: 새 터미널에서 모바일 서버 시작
bun dev:native

# 출력 확인:
# ► Expo
```

---

### Step 6: tRPC 테스트

```
브라우저: http://localhost:3001/api/trpc
```

**확인 사항:**
- tRPC 패널 로드됨
- `healthCheck` 프로시저 보임

**테스트:**
1. `healthCheck` 호출 → "OK" 반환
2. `privateData` 호출 → 401 (인증 필요)

---

## ✅ Phase 1 완료 체크리스트

| 항목 | 상태 | 확인 |
|------|------|------|
| DB 스키마 5개 파일 생성 | ✅ | `ls packages/db/src/schema/` |
| 마이그레이션 생성 | ✅ | `src/migrations/` 폴더 확인 |
| 마이그레이션 적용 | ✅ | Supabase SQL 쿼리 |
| API 라우터 3개 파일 생성 | ✅ | `ls packages/api/src/routers/` |
| 타입 체크 통과 | ✅ | `bun check-types` |
| 개발 서버 실행 | ✅ | `bun dev:web` & `bun dev:native` |
| tRPC 테스트 | ✅ | http://localhost:3001/api/trpc |

---

## 🎯 Phase 2 준비 (다음 단계)

Phase 1 완료 후 준비:

1. ✅ `all-questions.json` 데이터 시드 스크립트 작성
2. ✅ 웹 프론트엔드 페이지 구현 (로그인/대시보드/학습/통계)
3. ✅ 모바일 앱 UI 구현
4. ✅ 배포 설정

---

## 🚨 에러 발생 시 해결

### "Table already exists"
```bash
# Supabase SQL Editor에서 테이블 삭제 후 재시도
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS progress CASCADE;
DROP TABLE IF EXISTS decks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

# 다시 실행
bun db:push
```

### "Cannot find module '@my-better-t-app/db'"
```bash
# 의존성 재설치
bun install

# 캐시 초기화
bun install --no-cache
```

### "No such table: users"
```
→ bun db:push 가 제대로 실행되지 않음
→ DATABASE_URL 확인 후 재시도
```

---

**상태**: Phase 1 준비 완료 ✅  
**다음**: 위 순서대로 실행!
