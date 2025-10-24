'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/utils/trpc'
import { QuestionCard } from '@/components/question/question-card'
import { ProgressBar } from '@/components/study/progress-bar'
import { SessionTimer } from '@/components/study/session-timer'
import { ScoreCard } from '@/components/study/score-card'
import { Button } from '@/components/ui/button'
import Loader from '@/components/loader'
import { toast } from 'sonner'
import { CheckCircle2, ArrowLeft, RotateCcw } from 'lucide-react'

export default function ReviewStudyPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showScoreCard, setShowScoreCard] = useState(false)

  // 틀린 문제 진행 기록 가져오기 (FIX-0008: 기본값 가드)
  const { data: incorrectProgress = [], isLoading: progressLoading } = 
    trpc.progress.getIncorrect.useQuery()

  // 틀린 문제의 questionId 추출
  const questionIds = useMemo(() => {
    return incorrectProgress.map(p => p.questionId)
  }, [incorrectProgress])

  // 실제 문제 데이터 가져오기 (FIX-0008: 기본값 가드)
  const { data: questions = [], isLoading: questionsLoading } = 
    trpc.question.getByIds.useQuery(
      { ids: questionIds },
      { enabled: questionIds.length > 0 } // questionIds가 있을 때만 실행
    )

  const isLoading = progressLoading || questionsLoading

  // 세션 시작
  const startSession = trpc.session.start.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      // FIX-0010: Date 직렬화 처리
      setSessionStartTime(new Date(data.startedAt))
    }
  })

  // 세션 종료
  const endSession = trpc.session.end.useMutation({
    onSuccess: () => {
      setShowScoreCard(true)
    }
  })

  // 페이지 진입 시 세션 시작 (questions가 있을 때만)
  useEffect(() => {
    if (questions.length > 0 && sessionId === null) {
      startSession.mutate({ mode: 'review' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length])

  // 답안 제출
  const submitAnswer = trpc.progress.submit.useMutation({
    onSuccess: () => {
      if (selectedAnswer === questions?.[currentIndex].correctAnswer) {
        setCorrectCount(prev => prev + 1)
        toast.success('정답입니다! 이제 정답을 아셨네요! 🎉')
      } else {
        toast.error('다시 한번 복습이 필요해요 😢')
      }
      setShowAnswer(true)
    },
    onError: (error) => {
      toast.error('제출 중 오류가 발생했습니다: ' + error.message)
    }
  })

  const handleSubmit = () => {
    if (selectedAnswer === null) {
      toast.error('답을 선택해주세요')
      return
    }

    const currentQuestion = questions[currentIndex]
    submitAnswer.mutate({
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect: selectedAnswer === currentQuestion.correctAnswer,
    })
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowAnswer(false)
    } else {
      // 완료 - 세션 종료
      if (sessionId !== null) {
        endSession.mutate({
          sessionId,
          questionsCompleted: currentIndex + 1,
          correctAnswers: correctCount,
        })
      } else {
        toast.success('복습을 완료했습니다! 🎊')
        router.push('/dashboard')
      }
    }
  }

  const handleRetry = () => {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowAnswer(false)
    setCorrectCount(0)
    setShowScoreCard(false)
    startSession.mutate({ mode: 'review' })
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setSelectedAnswer(null)
      setShowAnswer(false)
    }
  }

  // ScoreCard 표시
  if (showScoreCard) {
    return (
      <ScoreCard
        totalQuestions={currentIndex + 1}
        correctAnswers={correctCount}
        mode="review"
        duration={elapsedSeconds}
        onRetry={handleRetry}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Loader />
      </div>
    )
  }

  // 빈 상태 - 틀린 문제가 없을 때
  if (!questions || questions.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/study')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          학습 모드로 돌아가기
        </Button>

        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">완벽해요! 🎉</h2>
          <p className="text-muted-foreground mb-6">
            틀린 문제가 없습니다. 계속해서 새로운 문제를 풀어보세요!
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/study/sequential')}>
              순차 학습 시작
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/study/random')}
            >
              랜덤 학습 시작
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/study')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          학습 모드로 돌아가기
        </Button>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">복습 모드</h1>
            <div className="flex items-center gap-1 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-1 rounded">
              <RotateCcw className="w-3 h-3" />
              <span>틀린 문제 {questions.length}개</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {sessionStartTime && (
              <SessionTimer 
                startTime={sessionStartTime}
                onTimeUpdate={setElapsedSeconds}
              />
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>{correctCount} / {currentIndex + 1}</span>
            </div>
          </div>
        </div>

        <ProgressBar 
          current={currentIndex + 1} 
          total={questions.length}
          correct={correctCount}
        />
      </div>

      {/* 문제 카드 */}
      <div className="mb-6">
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={setSelectedAnswer}
          showAnswer={showAnswer}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
        />
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          이전 문제
        </Button>

        {!showAnswer ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer === null || submitAnswer.isPending}
          >
            {submitAnswer.isPending ? '제출 중...' : '제출하기'}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {isLastQuestion ? '완료' : '다음 문제'}
          </Button>
        )}
      </div>
    </div>
  )
}


