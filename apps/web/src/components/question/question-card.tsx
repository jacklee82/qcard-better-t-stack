'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeBlock } from './code-block'
import { AnswerOptions } from './answer-options'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Bookmark } from 'lucide-react'
import { trpc } from '@/utils/trpc'
import { toast } from 'sonner'
import { useState } from 'react'

interface Question {
  id: string
  category: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  code: string | null
  difficulty: string
}

interface QuestionCardProps {
  question: Question
  selectedAnswer: number | null
  onAnswerSelect: (index: number) => void
  showAnswer?: boolean
  questionNumber?: number
  totalQuestions?: number
  showBookmark?: boolean
}

export function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  showAnswer = false,
  questionNumber,
  totalQuestions,
  showBookmark = true,
}: QuestionCardProps) {
  const [localIsBookmarked, setLocalIsBookmarked] = useState(false)

  // 북마크 상태 확인 (FIX-0008: 기본값 가드)
  const { data: isBookmarked = false } = trpc.bookmark.check.useQuery(
    { questionId: question.id },
    { enabled: showBookmark }
  )

  // 북마크 토글 (FIX-0007: tRPC hooks 패턴)
  const utils = trpc.useUtils()
  const toggleBookmark = trpc.bookmark.toggle.useMutation({
    onMutate: async () => {
      // Optimistic update
      setLocalIsBookmarked(!isBookmarked)
    },
    onSuccess: (data) => {
      // 성공 후 캐시 무효화
      utils.bookmark.check.invalidate({ questionId: question.id })
      utils.bookmark.getAll.invalidate()
      utils.bookmark.getBookmarkedQuestions.invalidate()
      
      toast.success(data.isBookmarked ? '북마크에 추가했습니다 ⭐' : '북마크를 해제했습니다')
      setLocalIsBookmarked(data.isBookmarked)
    },
    onError: (error) => {
      // 에러 시 롤백
      setLocalIsBookmarked(isBookmarked)
      toast.error('북마크 변경 실패: ' + error.message)
    }
  })

  const handleBookmarkClick = () => {
    toggleBookmark.mutate({ questionId: question.id })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'hard':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-muted'
    }
  }

  const displayIsBookmarked = localIsBookmarked || isBookmarked

  return (
    <Card className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {question.category}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn('text-xs', getDifficultyColor(question.difficulty))}
            >
              {question.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {questionNumber && totalQuestions && (
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {questionNumber} / {totalQuestions}
              </span>
            )}
            {showBookmark && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBookmarkClick}
                disabled={toggleBookmark.isPending}
                className="h-8 w-8"
                title={displayIsBookmarked ? '북마크 해제' : '북마크 추가'}
              >
                <Bookmark 
                  className={cn(
                    'h-4 w-4 transition-colors',
                    displayIsBookmarked && 'fill-amber-500 text-amber-500'
                  )}
                />
              </Button>
            )}
          </div>
        </div>
        <CardTitle className="text-xl leading-relaxed">
          {question.question}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {question.code && <CodeBlock code={question.code} />}

        <AnswerOptions
          options={question.options}
          selectedAnswer={selectedAnswer}
          correctAnswer={showAnswer ? question.correctAnswer : undefined}
          onSelect={onAnswerSelect}
          disabled={showAnswer}
          showAnswer={showAnswer}
        />

        {showAnswer && (
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-primary">💡</span>
              해설
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {question.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}




