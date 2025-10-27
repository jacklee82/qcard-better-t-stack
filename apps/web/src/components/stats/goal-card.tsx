'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { trpc } from '@/utils/trpc'
import { Target, Edit2, Save, X, TrendingUp, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export function GoalCard() {
  const [isEditing, setIsEditing] = useState(false)
  const [targetAccuracy, setTargetAccuracy] = useState<number>(80)
  const [dailyTarget, setDailyTarget] = useState<number>(10)

  const { data: goal, isLoading } = trpc.goal.get.useQuery()
  const { data: progress } = trpc.goal.getProgress.useQuery()
  const { data: totalCount = 0 } = trpc.question.getCount.useQuery()
  const utils = trpc.useUtils()

  const setGoal = trpc.goal.set.useMutation({
    onSuccess: () => {
      utils.goal.get.invalidate()
      utils.goal.getProgress.invalidate()
      toast.success('목표가 설정되었습니다 🎯')
      setIsEditing(false)
    },
    onError: (error) => {
      toast.error('목표 설정 실패: ' + error.message)
    }
  })

  const deleteGoal = trpc.goal.delete.useMutation({
    onSuccess: () => {
      utils.goal.get.invalidate()
      utils.goal.getProgress.invalidate()
      toast.success('목표가 삭제되었습니다')
      setIsEditing(false)
    },
    onError: (error) => {
      toast.error('목표 삭제 실패: ' + error.message)
    }
  })

  const handleSave = () => {
    if (targetAccuracy < 0 || targetAccuracy > 100) {
      toast.error('정답률은 0~100 사이로 입력해주세요')
      return
    }
    if (dailyTarget < 1 || dailyTarget > totalCount) {
      toast.error(`일일 문제 수는 1~${totalCount} 사이로 입력해주세요`)
      return
    }

    setGoal.mutate({
      targetAccuracy: targetAccuracy / 100,
      dailyQuestionTarget: dailyTarget,
    })
  }

  const handleEdit = () => {
    if (goal) {
      setTargetAccuracy((goal.targetAccuracy || 0.8) * 100)
      setDailyTarget(goal.dailyQuestionTarget || 10)
    }
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm('목표를 삭제하시겠습니까?')) {
      deleteGoal.mutate()
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            학습 목표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    )
  }

  // 편집 모드
  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            학습 목표 설정
          </CardTitle>
          <CardDescription>
            목표를 설정하고 꾸준히 학습하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetAccuracy">목표 정답률 (%)</Label>
            <Input
              id="targetAccuracy"
              type="number"
              min="0"
              max="100"
              value={targetAccuracy}
              onChange={(e) => setTargetAccuracy(Number(e.target.value))}
              placeholder="80"
            />
            <p className="text-xs text-muted-foreground">
              달성하고 싶은 정답률을 입력하세요 (0-100)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyTarget">일일 목표 문제 수</Label>
            <Input
              id="dailyTarget"
              type="number"
              min="1"
              max={totalCount.toString()}
              value={dailyTarget}
              onChange={(e) => setDailyTarget(Number(e.target.value))}
              placeholder="10"
            />
            <p className="text-xs text-muted-foreground">
              하루에 풀고 싶은 문제 수를 입력하세요 (1-{totalCount})
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={setGoal.isPending}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {setGoal.isPending ? '저장 중...' : '저장'}
            </Button>
            <Button 
              onClick={handleCancel} 
              variant="outline"
              disabled={setGoal.isPending}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {goal && (
            <Button 
              onClick={handleDelete} 
              variant="destructive" 
              size="sm"
              disabled={deleteGoal.isPending}
              className="w-full"
            >
              목표 삭제
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // 목표가 없는 경우
  if (!goal || !progress?.hasGoal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            학습 목표
          </CardTitle>
          <CardDescription>
            목표를 설정하고 꾸준히 학습하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            아직 학습 목표가 설정되지 않았습니다.
          </p>
          <Button onClick={handleEdit} className="w-full">
            <Target className="w-4 h-4 mr-2" />
            목표 설정하기
          </Button>
        </CardContent>
      </Card>
    )
  }

  // 목표가 있는 경우 - 진행률 표시
  const currentAccuracyPercent = (progress.currentAccuracy || 0) * 100
  const targetAccuracyPercent = (progress.targetAccuracy || 0) * 100
  const accuracyProgress = progress.accuracyProgress || 0
  const dailyProgress = progress.dailyProgress || 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            학습 목표
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleEdit}>
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 정답률 목표 */}
        {progress.targetAccuracy !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="font-medium">정답률</span>
              </div>
              <span className="text-muted-foreground">
                {currentAccuracyPercent.toFixed(1)}% / {targetAccuracyPercent.toFixed(0)}%
              </span>
            </div>
            <Progress value={Math.min(accuracyProgress, 100)} className="h-2" />
            {accuracyProgress >= 100 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>목표 달성! 🎉</span>
              </div>
            )}
          </div>
        )}

        {/* 일일 문제 목표 */}
        {progress.dailyQuestionTarget !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                <span className="font-medium">오늘의 학습</span>
              </div>
              <span className="text-muted-foreground">
                {progress.dailyQuestionsCompleted || 0} / {progress.dailyQuestionTarget}
              </span>
            </div>
            <Progress value={Math.min(dailyProgress, 100)} className="h-2" />
            {dailyProgress >= 100 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>오늘 목표 달성! 🎉</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

