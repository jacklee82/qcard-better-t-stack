### 문제 요약
- **오류 유형**: Runtime TypeError
- **메시지**: Cannot read properties of undefined (reading 'length')
- **환경**: Next.js 16.0.0 (Turbopack)

### 영향 범위
- 페이지: `apps/web/src/app/study/sequential/page.tsx`
- 증상: 초기 렌더 중 `questions`가 `undefined`일 때 `.length`와 인덱싱 접근으로 크래시

### 원인 분석
- `trpc.question.getAll.useQuery()`는 초기 렌더에서 `data`가 `undefined`일 수 있음
- 기존 코드가 `questions!.length`, `questions![currentIndex]`처럼 non-null assertion에 의존
- 데이터 로딩 타이밍에 `.length`가 `undefined`에서 호출되어 예외 발생

### 재현 절차
1. `/study/sequential` 접속
2. 네트워크가 느리거나 첫 렌더 타이밍에 TRPC 응답이 아직 없는 상태
3. 컴포넌트가 `questions.length` 접근 → 런타임 오류 발생

### 수정 사항
- `questions`에 안전한 기본값(`[]`)을 부여하고 non-null assertion 제거
- 로직은 기존 로딩/빈 상태 가드와 자연스럽게 맞물림

수정 코드 발췌:

```tsx
// 모든 문제 가져오기
const { data: questions = [], isLoading } = trpc.question.getAll.useQuery()

// 답안 제출 시 현재 문제 접근
const currentQuestion = questions[currentIndex]

// 다음 문제로 이동
if (currentIndex < questions.length - 1) {
  // ...
}
```

관련 파일: `apps/web/src/app/study/sequential/page.tsx`

### 검증 체크리스트
- 로딩 중에는 크래시 없이 로더만 보인다
- 질문 데이터가 비어 있을 때 빈 상태 UI가 정상 표시된다
- 정답 제출/다음 문제 이동이 정상 동작한다

### 재발 방지 가이드
- **디폴트 값 규칙**: 배열 응답은 항상 `const { data = [] } = useQuery()` 형태로 디폴트 지정
- **접근 가드**: `.length` 또는 인덱싱 전에 로딩/빈 배열 여부 확인
- **non-null assertion 지양**: `!` 대신 안전한 기본값과 조건부 분기 사용


