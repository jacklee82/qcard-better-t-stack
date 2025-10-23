'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/utils/trpc'
import { QuestionCard } from '@/components/question/question-card'
import { ProgressBar } from '@/components/study/progress-bar'
import { Button } from '@/components/ui/button'
import Loader from '@/components/loader'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'

export default function SequentialStudyPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  // 모든 문제 가져오기
  const { data: questions = [], isLoading } = trpc.question.getAll.useQuery()

  // 답안 제출
  const submitAnswer = trpc.progress.submit.useMutation({
    onSuccess: () => {
      if (selectedAnswer === questions?.[currentIndex].correctAnswer) {
        setCorrectCount(prev => prev + 1)
        toast.success('정답입니다! 🎉')
      } else {
        toast.error('틀렸습니다 😢')
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
      // 완료
      toast.success('모든 문제를 완료했습니다! 🎊')
      router.push('/dashboard')
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setSelectedAnswer(null)
      setShowAnswer(false)
    }
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
            데이터베이스를 확인해주세요
          </p>
          <Button onClick={() => router.push('/study')}>
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
          onClick={() => router.push('/study')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          학습 모드로 돌아가기
        </Button>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">순차 학습</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>{correctCount} / {currentIndex + 1}</span>
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

