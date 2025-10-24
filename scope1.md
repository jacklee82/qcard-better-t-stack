# Qcard Quiz App - Project Scope

**프로젝트명**: Qcard (Quiz Card Application)  
**스택**: Better-T-Stack (Next.js + React Native + tRPC + Drizzle + Supabase + Better Auth)  
**목표**: Python/데이터 분석 퀴즈 카드 웹/모바일 앱

---

## 📊 프로젝트 개요

### 데이터 소스
- `all-questions.json`: 200개의 Python/데이터 분석 문제
- 카테고리별 분류, 난이도별 구분
- 코드 예제 포함

### 핵심 기능
1. **학습 모드**: 순차, 랜덤, 카테고리별, 복습
2. **진도 추적**: 사용자별 정답률, 학습 기록
3. **통계**: 카테고리별/난이도별 성과 분석
4. **북마크**: 중요 문제 저장
5. **인증**: 사용자 로그인/회원가입

---

## 🗄️ 데이터베이스 설계

### Better Auth 기본 테이블 (자동 생성)
- `user`: 사용자 정보
- `session`: 세션 관리
- `account`: OAuth 계정 연동
- `verification`: 이메일 인증

### 커스텀 테이블 (5개)

#### 1. `questions` - 문제 데이터
```typescript
{
  id: string (PK)
  category: string
  question: text
  options: json (string[])
  correctAnswer: integer
  explanation: text
  code: text (nullable)
  difficulty: text ('easy' | 'medium' | 'hard')
  createdAt: timestamp
}
```

#### 2. `user_progress` - 사용자 학습 기록
```typescript
{
  id: serial (PK)
  userId: string (FK -> user.id)
  questionId: string (FK -> questions.id)
  isCorrect: boolean
  selectedAnswer: integer
  attemptCount: integer
  lastAttemptedAt: timestamp
  createdAt: timestamp
}
```

#### 3. `study_sessions` - 학습 세션
```typescript
{
  id: serial (PK)
  userId: string (FK -> user.id)
  startTime: timestamp
  endTime: timestamp (nullable)
  durationSeconds: integer (nullable)
  questionsAnswered: integer
  correctAnswers: integer
  mode: text ('sequential' | 'random' | 'category' | 'review')
  category: text (nullable)
}
```

#### 4. `bookmarks` - 북마크
```typescript
{
  id: serial (PK)
  userId: string (FK -> user.id)
  questionId: string (FK -> questions.id)
  createdAt: timestamp
}
```

#### 5. `user_stats` - 사용자 통계
```typescript
{
  id: serial (PK)
  userId: string (FK -> user.id)
  totalQuestionsAnswered: integer
  totalCorrectAnswers: integer
  accuracy: real (0.0 ~ 1.0)
  streak: integer (연속 학습일)
  lastStudiedAt: timestamp (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## 🔌 tRPC API 구조

### 1. `questionRouter` - 문제 관련 API
```typescript
- getAll(): 모든 문제 조회
- getById(id): 특정 문제 조회
- getRandom(count, category?, difficulty?): 랜덤 문제
- getByCategory(category): 카테고리별 문제
- getByDifficulty(difficulty): 난이도별 문제
- getCategories(): 카테고리 목록
- getCount(category?, difficulty?): 문제 개수
```

### 2. `progressRouter` - 진도 관련 API
```typescript
- get(questionId): 특정 문제 진도 조회
- getAll(): 전체 진도 조회
- submit(questionId, selectedAnswer, isCorrect, sessionId?): 답안 제출
- getIncorrect(): 오답 문제 목록
- getAccuracy(): 정답률 계산
- reset(): 진도 초기화
```

### 4. `bookmarkRouter` - 북마크 관련 API
```typescript
- toggle(questionId, note?): 북마크 토글 (추가/삭제)
- getAll(): 전체 북마크 목록
- check(questionId): 북마크 여부 확인
- getBookmarkedQuestions(): 북마크된 문제 데이터
- updateNote(questionId, note): 북마크 노트 업데이트
```

### 5. `sessionRouter` - 세션 관리 API ⭐
```typescript
- start(mode, categoryFilter?, difficultyFilter?): 세션 시작
- end(sessionId, questionsCompleted, correctAnswers): 세션 종료
- getCurrent(): 현재 활성 세션
- getRecent(limit): 최근 세션 목록
- getStats(): 세션 통계
```

### 6. `goalRouter` - 학습 목표 관리 API ⭐ NEW
```typescript
- set(targetAccuracy?, dailyQuestionTarget?): 목표 설정/수정
- get(): 현재 목표 조회
- getProgress(): 목표 대비 진행률
- delete(): 목표 삭제
```

### 3. `statsRouter` - 통계 관련 API
```typescript
- getOverview(): 전체 통계 요약
- getByCategory(): 카테고리별 통계
- getByDifficulty(): 난이도별 통계
- getRecentActivity(limit): 최근 활동
- getDailyStats(): 일별 통계
```

---

## 🎨 프론트엔드 구조

### 컴포넌트 (Web - Next.js)

#### 문제 관련
- ✅ `QuestionCard`: 문제 표시 카드 + 북마크
- ✅ `AnswerOptions`: 선택지 (라디오 버튼)
- ✅ `CodeBlock`: Python 코드 하이라이팅
- ✅ `ExplanationModal`: 해설 모달 ⭐

#### 학습 관련
- ✅ `ProgressBar`: 진행률 표시
- ✅ `SessionTimer`: 학습 시간 타이머 ⭐
- ✅ `ScoreCard`: 점수 카드 + 결과 화면 ⭐

#### 통계 관련
- ✅ `StatCard`: 통계 카드
- ✅ `CategoryChart`: 카테고리별 차트 (Recharts)
- ✅ `StreakCounter`: 연속 학습일 ⭐
- ✅ `DailyStatsChart`: 일별 통계 차트 ⭐
- ✅ `GoalCard`: 학습 목표 카드 ⭐ NEW
- ⏳ `AccuracyGauge`: 정답률 게이지

### 페이지 (Web - Next.js)

#### 인증
- ✅ `/login`: 로그인 (Better Auth)
- ✅ `/signup`: 회원가입

#### 메인
- ✅ `/`: 홈 (Health Check)
- ✅ `/dashboard`: 대시보드 (통계 요약)

#### 학습
- ✅ `/study`: 학습 모드 선택
- ✅ `/study/sequential`: 순차 학습 (전체 200문제)
- ✅ `/study/random`: 랜덤 학습 (랜덤 10문제)
- ✅ `/study/category`: 카테고리 선택
- ✅ `/study/category/[category]`: 카테고리별 학습 (동적 라우트)
- ✅ `/study/review`: 오답 복습 (틀린 문제만)

#### 기타
- ✅ `/stats`: 상세 통계 (카테고리별/난이도별/최근활동)
- ✅ `/bookmarks`: 북마크 목록

---

## 🚀 개발 로드맵

### ✅ Phase 1: Backend 설정 (완료)
- [x] 데이터베이스 스키마 설계 (5개 테이블)
- [x] Drizzle ORM 설정
- [x] tRPC 라우터 구현 (3개)
- [x] Seed 스크립트 작성
- [x] 데이터 마이그레이션
- [x] 200개 문제 데이터 시딩

### ✅ Phase 2: Frontend MVP (완료!)
- [x] 홈 페이지
- [x] 대시보드 (통계 표시)
- [x] 학습 모드 선택 페이지
- [x] 순차 학습 페이지
- [x] 문제 카드 컴포넌트
- [x] 진행률 표시
- [x] 통계 차트
- [x] 랜덤 학습 페이지
- [x] 카테고리 선택 페이지
- [x] 카테고리별 학습 페이지
- [x] 오답 복습 페이지
- [x] 상세 통계 페이지 🎉
- [x] 북마크 기능 (Router + UI + 페이지) 🎉
- [x] 회원가입 페이지 🎉

### ✅ Phase 3: 고급 기능 (완료!)
- [x] 학습 세션 관리 (sessionRouter + 타이머) ⭐
- [x] 연속 학습일 추적 (Streak 자동 계산) ⭐
- [x] ScoreCard 결과 화면 ⭐
- [x] ExplanationModal 상세 해설 ⭐
- [x] StreakCounter 컴포넌트 ⭐
- [x] 일별 통계 차트 (DailyStatsChart) ⭐
- [x] 모든 학습 페이지 세션 통합 (Sequential/Random/Review/Category) ⭐
- [x] 학습 목표 설정 (goalRouter + GoalCard) 🎉
- [x] 다크 모드 최적화 🎉
- [x] 애니메이션/전환 효과 🎉
- [x] FIX-0008/0010 패턴 전체 적용 🎉

### ⏳ Phase 4: 모바일 앱 (React Native)
- [ ] 기본 네비게이션
- [ ] 문제 풀이 화면
- [ ] 통계 화면
- [ ] 오프라인 지원
- [ ] 푸시 알림

### ⏳ Phase 5: 최적화 & 배포
- [ ] 성능 최적화
- [ ] SEO 최적화
- [ ] 에러 핸들링 강화
- [ ] 로딩 스켈레톤
- [ ] Vercel 배포
- [ ] 앱스토어 배포

---

## 🐛 해결된 주요 이슈

### 1. ✅ Seed 환경변수 로딩 순서 문제
- **문제**: PostgreSQL 인증 실패
- **해결**: `dotenv.config()` 먼저 실행, 로컬 db 인스턴스 생성

### 2. ✅ React Syntax Highlighter 의존성 오류
- **문제**: `refractor/lib/all` 모듈 없음
- **해결**: `Prism` → `Light` 버전으로 변경

### 3. ✅ Loader 컴포넌트 Export 타입 오류
- **문제**: Named import vs Default export
- **해결**: Default import 사용

### 4. ✅ tRPC 설정 오류
- **문제**: `contextMap[utilName] is not a function`
- **해결**: Provider 구조 전면 수정 (공식 패턴)

### 5. ✅ Sequential Study undefined length 오류
- **문제**: 초기 렌더에서 `questions`가 `undefined`
- **해결**: `const { data = [] }` 기본값 가드 패턴 적용

자세한 내용: [SUCCESS-FIXES.md](./docs/SUCCESS-FIXES.md)

---

## 📦 기술 스택

### Frontend
- **Web**: Next.js 16 + TailwindCSS 4 + shadcn/ui
- **Mobile**: React Native + NativeWind
- **State**: TanStack Query + tRPC
- **Charts**: Recharts
- **Code**: React Syntax Highlighter

### Backend
- **API**: tRPC (Type-safe RPC)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle
- **Auth**: Better Auth

### DevOps
- **Monorepo**: Turborepo
- **Package Manager**: Bun
- **Deployment**: Vercel (Web), Expo (Mobile)
- **Database**: Supabase (Managed PostgreSQL)

---

## 📈 현재 진행률

| 단계 | 진행률 | 상태 |
|------|--------|------|
| Phase 1: Backend | 100% | ✅ 완료 |
| Phase 2: Frontend MVP | 100% | ✅ 완료 |
| Phase 3: 고급 기능 | 100% | ✅ 완료 |
| Phase 4: 모바일 앱 | 0% | ⏳ 대기 |
| Phase 5: 배포 | 0% | ⏳ 대기 |

**전체 진행률**: ~60% (Phase 1, 2, 3 완료!)

---

## 🎯 다음 단계

### ✅ Phase 3 완료! 🎉

**완료된 작업:**
- ✅ Category 페이지 세션 통합
- ✅ 학습 목표 설정 기능 (goalRouter + GoalCard)
- ✅ 다크 모드 최적화 (차트, ScoreCard, 컴포넌트)
- ✅ 애니메이션/전환 효과 (QuestionCard, ScoreCard)
- ✅ FIX-0008 패턴 전체 적용 (배열 기본값 가드)
- ✅ FIX-0010 패턴 전체 적용 (Date 직렬화 처리)

---

### 우선순위 1 (High) - Phase 3.5 안정화
1. 에러 바운더리 추가
2. 로딩 스켈레톤 개선
3. 에러 핸들링 강화
4. 테스트 작성 (기본 E2E)

### 우선순위 2 (Medium) - Phase 4 모바일
1. React Native 기본 네비게이션
2. 문제 풀이 화면
3. 통계 화면
4. 오프라인 지원

### 우선순위 3 (Low) - Phase 5 배포
1. Vercel 배포 설정
2. 환경변수 관리
3. 성능 최적화
4. SEO 최적화
5. 앱스토어 배포 준비

---

## 📝 참고 문서

- [해결된 오류 목록](./docs/FIXED_ERRORS.md)
- [tRPC 공식 문서](https://trpc.io/docs)
- [Drizzle ORM 문서](https://orm.drizzle.team/)
- [Better Auth 문서](https://www.better-auth.com/docs)

---

**마지막 업데이트**: 2025-10-24  
**버전**: 2.0.0-alpha  
**상태**: Phase 3 완료! 🎉 Phase 4 준비 중