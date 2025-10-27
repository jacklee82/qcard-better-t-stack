'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/utils/trpc'
import { QuestionCard } from '@/components/question/question-card'
import { ProgressBar } from '@/components/study/progress-bar'
import { SessionTimer } from '@/components/study/session-timer'
import { ScoreCard } from '@/components/study/score-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Loader from '@/components/loader'
import { toast } from 'sonner'
import { CheckCircle2, ArrowLeft, FolderOpen } from 'lucide-react'

export default function CategoryStudyPage({ 
  params 
}: { 
  params: Promise<{ category: string }> 
}) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const category = decodeURIComponent(resolvedParams.category)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showScoreCard, setShowScoreCard] = useState(false)

  // 카테고리별 문제 가져오기 (FIX-0008: 기본값 가드)
  const { data: questions = [], isLoading } = trpc.question.getByCategory.useQuery({ 
    category 
  })

  // 세션 관리
  const startSession = trpc.session.start.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      setSessionStartTime(new Date(data.startedAt))
    }
  })

  const endSession = trpc.session.end.useMutation({
    onSuccess: () => {
      setShowScoreCard(true)
    }
  })

  // 컴포넌트 마운트 시 세션 시작
  useEffect(() => {
    startSession.mutate({ mode: 'category', categoryFilter: category })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 답안 제출 (Optimistic UI: UI 즉시 업데이트)
  const submitAnswer = trpc.progress.submit.useMutation({
    onSuccess: () => {
      console.log("진행률 저장 완료");
    },
    onError: (error) => {
      console.error("진행률 저장 실패:", error);
    }
  })

  const handleSubmit = () => {
    if (selectedAnswer === null) {
      toast.error('답을 선택해주세요')
      return
    }

    const currentQuestion = questions[currentIndex]
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer

    // ✅ 즉시 UI 업데이트 (Optimistic UI)
    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
      toast.success('정답입니다! 🎉')
    } else {
      toast.error('틀렸습니다 😢')
    }
    setShowAnswer(true)

    // ✅ 백그라운드 서버 전송
    submitAnswer.mutate({
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
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
        toast.success(`${category} 카테고리를 완료했습니다! 🎊`)
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
    startSession.mutate({ mode: 'category', categoryFilter: category })
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
        mode="category"
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

  if (!questions || questions.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">문제를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">
            {category} 카테고리에 문제가 없습니다
          </p>
          <Button onClick={() => router.push('/study/category')}>
            돌아가기
          </Button>
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
          onClick={() => router.push('/study/category')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          카테고리 선택으로 돌아가기
        </Button>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">카테고리별 학습</h1>
            <Badge variant="secondary" className="flex items-center gap-1">
              <FolderOpen className="w-3 h-3" />
              {category}
            </Badge>
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


