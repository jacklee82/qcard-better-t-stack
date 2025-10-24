'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CodeBlock } from './code-block'
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react'

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

interface ExplanationModalProps {
  question: Question
  open: boolean
  onClose: () => void
  userAnswer?: number | null
}

export function ExplanationModal({
  question,
  open,
  onClose,
  userAnswer,
}: ExplanationModalProps) {
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl">상세 해설</DialogTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {question.category}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-xs ${getDifficultyColor(question.difficulty)}`}
              >
                {question.difficulty}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 문제 */}
          <div>
            <h3 className="font-semibold text-lg mb-3">📝 문제</h3>
            <p className="leading-relaxed">{question.question}</p>
          </div>

          {/* 코드 */}
          {question.code && (
            <div>
              <h3 className="font-semibold text-lg mb-3">💻 코드</h3>
              <CodeBlock code={question.code} />
            </div>
          )}

          {/* 선택지 */}
          <div>
            <h3 className="font-semibold text-lg mb-3">선택지</h3>
            <div className="space-y-2">
              {question.options.map((option, index) => {
                const isCorrect = index === question.correctAnswer
                const isUserAnswer = userAnswer !== undefined && userAnswer !== null && index === userAnswer
                const showCorrect = isCorrect
                const showWrong = isUserAnswer && !isCorrect

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      showCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : showWrong
                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                        : 'border-border bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-sm">{index + 1}.</span>
                      <div className="flex-1">
                        <p>{option}</p>
                      </div>
                      {showCorrect && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-medium">정답</span>
                        </div>
                      )}
                      {showWrong && (
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">선택한 답</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 정답 */}
          <div className="p-4 bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              정답
            </h4>
            <p className="text-green-900 dark:text-green-100 font-medium">
              {question.correctAnswer + 1}. {question.options[question.correctAnswer]}
            </p>
          </div>

          {/* 해설 */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              해설
            </h4>
            <p className="text-blue-900 dark:text-blue-100 leading-relaxed whitespace-pre-line">
              {question.explanation}
            </p>
          </div>

          {/* 사용자 결과 (userAnswer가 있을 경우) */}
          {userAnswer !== undefined && userAnswer !== null && (
            <div className={`p-4 rounded-lg border-2 ${
              userAnswer === question.correctAnswer
                ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {userAnswer === question.correctAnswer ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-700 dark:text-green-400">
                      정답입니다! 🎉
                    </h4>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-red-700 dark:text-red-400">
                      틀렸습니다
                    </h4>
                  </>
                )}
              </div>
              <p className="text-sm">
                {userAnswer === question.correctAnswer
                  ? '완벽합니다! 정답을 잘 이해하고 계시네요.'
                  : `선택한 답: ${userAnswer + 1}. ${question.options[userAnswer]}`
                }
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

