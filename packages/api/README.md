# API Package

tRPC API 라우터 및 프로시저 정의

## 라우터 구조

### Question Router (`question`)
문제 데이터 관련 API

```typescript
// 모든 문제
trpc.question.getAll.useQuery()

// 특정 문제
trpc.question.getById.useQuery({ id: 'q001' })

// 랜덤 문제
trpc.question.getRandom.useQuery({ 
  count: 10, 
  category: '라이브러리 임포트',
  difficulty: 'easy'
})

// 카테고리별
trpc.question.getByCategory.useQuery({ category: '데이터 시각화' })

// 난이도별
trpc.question.getByDifficulty.useQuery({ difficulty: 'medium' })

// 여러 ID로 가져오기
trpc.question.getByIds.useQuery({ ids: ['q001', 'q002'] })

// 카테고리 목록
trpc.question.getCategories.useQuery()

// 난이도 목록
trpc.question.getDifficulties.useQuery()

// 문제 개수
trpc.question.getCount.useQuery({ category: '데이터 시각화' })
```

### Progress Router (`progress`) 🔒
사용자 진행 상황 관련 API (인증 필요)

```typescript
// 특정 문제 진행 상황
trpc.progress.get.useQuery({ questionId: 'q001' })

// 전체 진행 상황
trpc.progress.getAll.useQuery()

// 답안 제출
trpc.progress.submit.useMutation({
  questionId: 'q001',
  selectedAnswer: 0,
  isCorrect: true
})

// 진행 상황 초기화
trpc.progress.reset.useMutation({ questionId: 'q001' }) // 특정 문제
trpc.progress.reset.useMutation() // 전체

// 틀린 문제 목록
trpc.progress.getIncorrect.useQuery()

// 정답률
trpc.progress.getAccuracy.useQuery()
```

### Stats Router (`stats`) 🔒
통계 및 분석 API (인증 필요)

```typescript
// 전체 통계 개요
trpc.stats.getOverview.useQuery()

// 카테고리별 통계
trpc.stats.getByCategory.useQuery()

// 난이도별 통계
trpc.stats.getByDifficulty.useQuery()

// 연속 학습일
trpc.stats.getStreak.useQuery()

// 최근 활동
trpc.stats.getRecentActivity.useQuery({ limit: 10 })

// 일별 학습 통계
trpc.stats.getDailyStats.useQuery({ days: 7 })
```

## 타입

모든 API는 완전한 타입 추론을 지원합니다:

```typescript
import type { AppRouter } from '@my-better-t-app/api'

// 자동 타입 추론
const { data } = trpc.question.getAll.useQuery()
// data: Question[]

const { mutate } = trpc.progress.submit.useMutation()
// mutate 파라미터가 자동으로 타입 체크됨
```

## 컨텍스트

tRPC 컨텍스트는 다음을 포함합니다:

```typescript
{
  session: Session | null,  // Better Auth 세션
  db: DrizzleDB             // Drizzle ORM 인스턴스
}
```

## 프로시저 타입

- `publicProcedure`: 인증 불필요
- `protectedProcedure`: 인증 필요 (세션 체크)

## 사용 예시

### Web (Next.js)

```typescript
'use client'

import { trpc } from '@/utils/trpc'

export default function QuestionList() {
  const { data: questions, isLoading } = trpc.question.getAll.useQuery()
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      {questions?.map(q => (
        <div key={q.id}>{q.question}</div>
      ))}
    </div>
  )
}
```

### Mobile (React Native)

```typescript
import { trpc } from '../utils/trpc'

export default function QuestionScreen() {
  const { data: questions } = trpc.question.getRandom.useQuery({
    count: 10,
    difficulty: 'easy'
  })
  
  return (
    <View>
      {questions?.map(q => (
        <Text key={q.id}>{q.question}</Text>
      ))}
    </View>
  )
}
```

## 에러 핸들링

tRPC는 자동으로 에러를 처리합니다:

```typescript
const { data, error, isError } = trpc.question.getById.useQuery({ 
  id: 'invalid' 
})

if (isError) {
  console.error(error.message)
  // 적절한 에러 UI 표시
}
```

## 개발

### 빌드

```bash
bun run build
```

### 타입 체크

```bash
bun run check-types
```

## 의존성

- `@my-better-t-app/db` - 데이터베이스 스키마
- `@my-better-t-app/auth` - 인증
- `@trpc/server` - tRPC 서버
- `zod` - 입력 검증




