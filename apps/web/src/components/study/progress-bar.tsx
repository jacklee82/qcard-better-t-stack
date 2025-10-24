'use client'

import { Progress } from '@/components/ui/progress'

interface ProgressBarProps {
  current: number
  total: number
  correct?: number
}

export function ProgressBar({ current, total, correct }: ProgressBarProps) {
  const percentage = (current / total) * 100
  const accuracy = correct !== undefined ? (correct / current) * 100 : null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          문제 {current} / {total}
        </span>
        {accuracy !== null && (
          <span className="font-medium text-primary">
            정답률: {accuracy.toFixed(0)}%
          </span>
        )}
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}




