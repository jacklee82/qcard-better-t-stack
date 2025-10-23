'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeBlock } from './code-block'
import { AnswerOptions } from './answer-options'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
}

export function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  showAnswer = false,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
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

  return (
    <Card className="w-full">
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
          {questionNumber && totalQuestions && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {questionNumber} / {totalQuestions}
            </span>
          )}
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

