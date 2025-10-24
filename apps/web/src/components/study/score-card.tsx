'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, CheckCircle2, XCircle, Clock, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ScoreCardProps {
  totalQuestions: number
  correctAnswers: number
  mode: string
  duration?: number
  onRetry?: () => void
}

export function ScoreCard({
  totalQuestions,
  correctAnswers,
  mode,
  duration,
  onRetry,
}: ScoreCardProps) {
  const router = useRouter()
  const incorrectAnswers = totalQuestions - correctAnswers
  const accuracy = totalQuestions > 0 
    ? Math.round((correctAnswers / totalQuestions) * 100) 
    : 0

  const getGrade = (accuracy: number) => {
    if (accuracy >= 90) return { text: '완벽해요!', emoji: '🏆', color: 'text-amber-500' }
    if (accuracy >= 80) return { text: '훌륭해요!', emoji: '🎉', color: 'text-green-500' }
    if (accuracy >= 70) return { text: '잘했어요!', emoji: '👏', color: 'text-blue-500' }
    if (accuracy >= 60) return { text: '좋아요!', emoji: '👍', color: 'text-indigo-500' }
    return { text: '다시 도전!', emoji: '💪', color: 'text-gray-500' }
  }

  const grade = getGrade(accuracy)

  const formatDuration = (seconds: number = 0) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}분 ${secs}초`
  }

  const getModeText = (mode: string) => {
    switch (mode) {
      case 'sequential': return '순차 학습'
      case 'random': return '랜덤 학습'
      case 'category': return '카테고리 학습'
      case 'review': return '복습'
      default: return '학습'
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 animate-in fade-in zoom-in-95 duration-500">
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="mb-4 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Trophy className={`w-12 h-12 ${grade.color}`} />
            </div>
          </div>
          <CardTitle className="text-3xl mb-2">
            {grade.text} {grade.emoji}
          </CardTitle>
          <CardDescription className="text-lg">
            {getModeText(mode)} 완료
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 정답률 */}
          <div className="text-center p-6 bg-muted/50 dark:bg-muted/30 rounded-lg">
            <div className={`text-5xl font-bold mb-2 ${grade.color}`}>
              {accuracy}%
            </div>
            <p className="text-sm text-muted-foreground">정답률</p>
          </div>

          {/* 상세 통계 */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-500">
                      {correctAnswers}
                    </div>
                    <p className="text-xs text-muted-foreground">정답</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-red-500">
                      {incorrectAnswers}
                    </div>
                    <p className="text-xs text-muted-foreground">오답</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold text-blue-500">
                      {totalQuestions}
                    </div>
                    <p className="text-xs text-muted-foreground">총 문제</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {duration !== undefined && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-purple-500" />
                    <div>
                      <div className="text-lg font-bold text-purple-500">
                        {formatDuration(duration)}
                      </div>
                      <p className="text-xs text-muted-foreground">소요 시간</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-2 pt-4">
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => router.push('/dashboard')}
            >
              대시보드로 이동
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              {onRetry && (
                <Button 
                  variant="outline"
                  onClick={onRetry}
                >
                  다시 풀기
                </Button>
              )}
              {incorrectAnswers > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => router.push('/study/review')}
                >
                  오답 복습
                </Button>
              )}
            </div>

            <Button 
              variant="ghost"
              onClick={() => router.push('/study')}
            >
              다른 학습 모드
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

