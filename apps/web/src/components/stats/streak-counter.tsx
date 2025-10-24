'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/utils/trpc'
import { Flame, Calendar } from 'lucide-react'

export function StreakCounter() {
  // Streak 데이터 가져오기 (FIX-0008: 기본값 가드)
  const { data: streakData } = trpc.stats.getStreak.useQuery()

  const streak = streakData?.streak || 0
  const lastStudied = streakData?.lastStudiedAt

  const formatLastStudied = (date: Date | null | undefined) => {
    if (!date) return '아직 학습하지 않았습니다'
    
    const lastDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    lastDate.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 0) return '오늘'
    if (daysDiff === 1) return '어제'
    return `${daysDiff}일 전`
  }

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return '오늘부터 시작하세요!'
    if (streak === 1) return '좋은 시작입니다!'
    if (streak < 7) return '꾸준히 하고 있어요!'
    if (streak < 30) return '훌륭한 습관이네요! 🌟'
    if (streak < 100) return '대단해요! 계속 가세요! 🔥'
    return '전설이 되셨습니다! 🏆'
  }

  const getStreakColor = (streak: number) => {
    if (streak === 0) return 'text-gray-400'
    if (streak < 7) return 'text-orange-400'
    if (streak < 30) return 'text-orange-500'
    if (streak < 100) return 'text-orange-600'
    return 'text-amber-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className={`w-5 h-5 ${getStreakColor(streak)}`} />
          연속 학습일
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          {/* 연속일 수 */}
          <div>
            <div className={`text-5xl font-bold ${getStreakColor(streak)}`}>
              {streak}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              일 연속
            </p>
          </div>

          {/* 메시지 */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">
              {getStreakMessage(streak)}
            </p>
          </div>

          {/* 마지막 학습 */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>마지막 학습: {formatLastStudied(lastStudied)}</span>
          </div>

          {/* 진행률 바 (7일 단위) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>이번 주</span>
              <span>{Math.min(streak % 7 || (streak > 0 ? 7 : 0), 7)}/7</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${getStreakColor(streak).replace('text-', 'bg-')} transition-all duration-500`}
                style={{ 
                  width: `${Math.min((streak % 7 || (streak > 0 ? 7 : 0)) / 7 * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

