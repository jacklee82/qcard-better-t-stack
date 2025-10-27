# 프로젝트 구조

## 📁 디렉토리 구조

```
qcard-better-t-stack/
├── all-questions.json          # 200개 문제 데이터 (3902줄)
├── apps/
│   ├── web/                    # Next.js Web App
│   │   ├── src/
│   │   │   ├── app/            # App Router 페이지들
│   │   │   ├── components/     # React 컴포넌트들
│   │   │   └── lib/            # 유틸리티 함수들
│   │   └── package.json
│   └── native/                 # React Native App (Expo)
│       ├── app/                # Expo Router 페이지들
│       ├── components/         # React Native 컴포넌트들
│       └── package.json
├── packages/
│   ├── api/                    # tRPC API 서버
│   │   ├── src/
│   │   │   ├── routers/        # API 라우터들 (10개 파일)
│   │   │   └── utils/          # API 유틸리티들 (8개 파일)
│   │   └── package.json
│   ├── auth/                   # Better Auth 설정
│   │   └── src/index.ts
│   └── db/                     # Drizzle ORM + PostgreSQL
│       ├── src/
│       │   ├── schema/         # DB 스키마 (11개 파일)
│       │   └── migrations/     # DB 마이그레이션
│       └── package.json
└── scripts/                    # 유틸리티 스크립트들 (11개 파일)
```

## 🗄 데이터베이스 스키마

### 앱 테이블
- **questions**: 200개 문제 (14 카테고리, 3 난이도)
- **user_progress**: 사용자 진행 상황
- **study_sessions**: 학습 세션 기록
- **bookmarks**: 북마크
- **user_stats**: 통계 캐싱

### Auth 테이블 (Better Auth)
- user, session, account, verification

## 🔌 API 엔드포인트 (21개)

### Question Router (9개)
- `getAll()` - 모든 문제 조회
- `getRandom({ count })` - 랜덤 문제
- `getByCategory({ category })` - 카테고리별
- `getCategories()` - 카테고리 목록
- `getById({ id })` - 특정 문제
- `getByDifficulty({ difficulty })` - 난이도별
- `search({ query })` - 문제 검색
- `getStats()` - 문제 통계
- `getRandomByCategory({ category, count })` - 카테고리별 랜덤

### Progress Router (6개)
- `submit({ questionId, selectedAnswer, isCorrect })` - 답안 제출
- `getAll()` - 전체 진행 상황
- `getIncorrect()` - 틀린 문제들
- `getAccuracy()` - 정답률
- `getByCategory({ category })` - 카테고리별 진행 상황
- `reset()` - 진행 상황 초기화

### Stats Router (6개)
- `getOverview()` - 전체 통계
- `getByCategory()` - 카테고리별 분석
- `getRecentActivity({ limit })` - 최근 활동
- `getDailyStats({ days })` - 일별 통계
- `getStreak()` - 연속 학습일
- `getGoals()` - 학습 목표

## 📊 문제 카테고리 (14개)

1. 라이브러리 임포트
2. 데이터 불러오기
3. 데이터 시각화
4. 그룹화 및 집계
5. 데이터 전처리
6. 결측치 처리
7. 범주형 인코딩
8. 데이터셋 분리
9. 스케일링
10. 기본 모델링
11. 앙상블 모델링
12. 모델 성능 평가
13. 딥러닝 모델 구성
14. 딥러닝 평가 및 시각화

## 🎓 난이도 분포

- **Easy**: 80문제 (기본 문법, 기초 개념)
- **Medium**: 90문제 (활용, 응용)
- **Hard**: 30문제 (고급, 심화)

## 🛠 기술 스택

### Frontend
- **Web**: Next.js 16 + React 19 + TailwindCSS 4
- **Mobile**: React Native (Expo) + NativeWind
- **State Management**: TanStack Query + tRPC

### Backend
- **API**: tRPC 11
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle
- **Auth**: Better Auth 1.3

### Infrastructure
- **Monorepo**: Turborepo
- **Package Manager**: Bun 1.3
- **TypeScript**: 5.x

## 📝 주요 파일들

- `all-questions.json` - 200개 문제 데이터 (핵심)
- `packages/db/src/seed.ts` - 데이터베이스 시딩 스크립트
- `packages/api/src/routers/` - API 라우터들
- `apps/web/src/app/` - 웹 앱 페이지들
- `apps/native/app/` - 모바일 앱 페이지들