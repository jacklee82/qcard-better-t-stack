# Qcard - Python/데이터 분석 학습 큐카드 앱 🎯

[![Better-T-Stack](https://img.shields.io/badge/Built%20with-Better--T--Stack-blue)](https://github.com/AmanVarshney01/create-better-t-stack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Python 및 데이터 분석 학습을 위한 크로스 플랫폼 플래시카드 앱

## ✨ 주요 기능

- 📚 **200개 문제**: Python, NumPy, Pandas, 머신러닝 등 14개 카테고리
- 🎲 **다양한 학습 모드**: 순차, 랜덤, 카테고리별, 복습 모드
- 📊 **학습 통계**: 카테고리별, 난이도별 정답률 분석
- 🔐 **사용자 계정**: 학습 진행 상황 자동 저장
- 📱 **크로스 플랫폼**: Web + React Native

## 🛠 기술 스택

### Frontend
- **Web**: Next.js 16 + React 19 + TailwindCSS 4
- **Mobile**: React Native (Expo) + NativeWind
- **State Management**: TanStack Query + tRPC

### Backend
- **API**: tRPC 11 (21개 엔드포인트)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle
- **Auth**: Better Auth 1.3

### Infrastructure
- **Monorepo**: Turborepo
- **Package Manager**: Bun 1.3

## 🚀 빠른 시작

### 1. 설치

```bash
git clone https://github.com/jacklee82/qcard-better-t-stack.git
cd qcard-better-t-stack
bun install
```

### 2. 환경 변수 설정

`apps/web/.env` 파일 생성:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.com:6543/postgres
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=http://localhost:3001
```

### 3. 데이터베이스 설정

```bash
# 스키마 적용
bun run db:push

# 초기 데이터 시딩 (200개 문제)
bun run seed
```

### 4. 개발 서버 실행

```bash
# Web + Mobile 동시 실행
bun run dev

# 또는 개별 실행
bun run dev:web      # http://localhost:3001
bun run dev:native   # Expo
```

## 📁 프로젝트 구조

```
qcard-better-t-stack/
├── all-questions.json          # 200개 문제 데이터
├── apps/
│   ├── web/                    # Next.js Web App
│   └── native/                 # React Native App
├── packages/
│   ├── api/                    # tRPC API (3개 라우터)
│   │   ├── routers/
│   │   │   ├── question.ts     # 문제 조회 (9개 엔드포인트)
│   │   │   ├── progress.ts     # 진행 상황 (6개 엔드포인트)
│   │   │   └── stats.ts        # 통계 (6개 엔드포인트)
│   ├── auth/                   # Better Auth
│   └── db/                     # Drizzle ORM
│       ├── schema/             # 5개 테이블 스키마
│       └── src/seed.ts         # 시딩 스크립트
└── SCOPE.md                    # 상세 기획 문서
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

## 🔌 API 엔드포인트

### Question Router (Public)
```typescript
question.getAll()                    // 모든 문제
question.getRandom({ count: 10 })    // 랜덤 문제
question.getByCategory({ category }) // 카테고리별
question.getCategories()             // 카테고리 목록
```

### Progress Router (Protected)
```typescript
progress.submit({ questionId, selectedAnswer, isCorrect })
progress.getAll()                    // 전체 진행 상황
progress.getIncorrect()              // 틀린 문제
progress.getAccuracy()               // 정답률
```

### Stats Router (Protected)
```typescript
stats.getOverview()                  // 전체 통계
stats.getByCategory()                // 카테고리별 분석
stats.getRecentActivity({ limit })   // 최근 활동
stats.getDailyStats({ days })        // 일별 통계
```

## 📊 문제 카테고리 (14개)

- 라이브러리 임포트
- 데이터 불러오기
- 데이터 시각화
- 그룹화 및 집계
- 데이터 전처리
- 결측치 처리
- 범주형 인코딩
- 데이터셋 분리
- 스케일링
- 기본 모델링
- 앙상블 모델링
- 모델 성능 평가
- 딥러닝 모델 구성
- 딥러닝 평가 및 시각화

## 🎓 난이도

- **Easy**: 80문제 (기본 문법, 기초 개념)
- **Medium**: 90문제 (활용, 응용)
- **Hard**: 30문제 (고급, 심화)

## 📜 스크립트

```bash
bun dev              # 전체 개발 서버
bun build            # 전체 빌드
bun check-types      # 타입 체크

# Database
bun run db:push      # 스키마 푸시
bun run db:studio    # DB GUI (http://localhost:4983)
bun run db:generate  # 마이그레이션 생성
bun run seed         # 초기 데이터 시딩

# Individual Apps
bun run dev:web      # Web만
bun run dev:native   # Mobile만
```

## 🔧 개발 상태

### ✅ 완료
- [x] DB 스키마 설계 및 마이그레이션
- [x] 200개 문제 데이터 시딩
- [x] tRPC API 21개 엔드포인트
- [x] Better Auth 통합

### 🚧 진행 중
- [ ] Web UI (문제 풀이, 대시보드)
- [ ] Mobile UI
- [ ] 학습 모드 구현
- [ ] 통계 시각화

### 📋 예정
- [ ] 북마크 기능
- [ ] 학습 세션 관리
- [ ] 소셜 기능
- [ ] 오프라인 지원 (Mobile)

## 🤝 기여

Pull Request를 환영합니다!

## 📝 라이선스

MIT

## 📞 문의

- GitHub: [@jacklee82](https://github.com/jacklee82)
- Repository: [qcard-better-t-stack](https://github.com/jacklee82/qcard-better-t-stack)

---

**Built with ❤️ using Better-T-Stack**
