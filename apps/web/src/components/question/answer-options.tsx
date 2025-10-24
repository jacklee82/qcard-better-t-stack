'use client'

import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface AnswerOptionsProps {
  options: string[]
  selectedAnswer: number | null
  correctAnswer?: number
  onSelect: (index: number) => void
  disabled?: boolean
  showAnswer?: boolean
}

export function AnswerOptions({
  options,
  selectedAnswer,
  correctAnswer,
  onSelect,
  disabled = false,
  showAnswer = false,
}: AnswerOptionsProps) {
  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const isSelected = selectedAnswer === index
        const isCorrect = correctAnswer === index
        const isWrong = showAnswer && isSelected && !isCorrect

        return (
          <button
            key={index}
            onClick={() => !disabled && onSelect(index)}
            disabled={disabled}
            className={cn(
              'w-full p-4 text-left rounded-lg border-2 transition-all',
              'hover:border-primary/50 disabled:cursor-not-allowed',
              isSelected && !showAnswer && 'border-primary bg-primary/5',
              showAnswer && isCorrect && 'border-green-500 bg-green-500/10',
              showAnswer && isWrong && 'border-red-500 bg-red-500/10',
              !isSelected && !showAnswer && 'border-border'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium',
                    isSelected && !showAnswer && 'border-primary bg-primary text-primary-foreground',
                    showAnswer && isCorrect && 'border-green-500 bg-green-500 text-white',
                    showAnswer && isWrong && 'border-red-500 bg-red-500 text-white',
                    !isSelected && !showAnswer && 'border-muted-foreground/30'
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="flex-1">{option}</span>
              </div>
              
              {showAnswer && isCorrect && (
                <Check className="w-5 h-5 text-green-500" />
              )}
              {showAnswer && isWrong && (
                <X className="w-5 h-5 text-red-500" />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}




