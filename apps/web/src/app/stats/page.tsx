'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DailyStatsChart } from '@/components/stats/daily-stats-chart'
import { trpc } from '@/utils/trpc'
import Loader from '@/components/loader'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, Target, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function StatsPage() {
  const router = useRouter()
  
  // 통계 데이터 가져오기 (FIX-0008: 기본값 가드)
  const { data: overview } = trpc.stats.getOverview.useQuery()
  const { data: categoryStats = [] } = trpc.stats.getByCategory.useQuery()
  const { data: difficultyStats = [] } = trpc.stats.getByDifficulty.useQuery()
  const { data: recentActivity = [] } = trpc.stats.getRecentActivity.useQuery({ limit: 10 })

  const isLoading = !overview

  const COLORS = {
    easy: '#10b981',
    medium: '#f59e0b',
    hard: '#ef4444',
  }

  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Loader />
      </div>
    )
  }

  // 카테고리별 데이터를 차트 형식으로 변환
  const categoryChartData = categoryStats.map((stat) => ({
    name: stat.category,
    정답: stat.correct,
    오답: stat.total - stat.correct,
    정답률: stat.accuracy,
  }))

  // 난이도별 파이 차트 데이터
  const difficultyPieData = difficultyStats.map((stat) => ({
    name: stat.difficulty,
    value: stat.total,
    accuracy: stat.accuracy,
  }))

  const getDifficultyColor = (difficulty: string) => {
    return COLORS[difficulty.toLowerCase() as keyof typeof COLORS] || '#6b7280'
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          대시보드로 돌아가기
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">상세 통계</h1>
        </div>
        <p className="text-muted-foreground">
          학습 성과를 자세히 분석하고 개선할 영역을 찾아보세요
        </p>
      </div>

      {/* 전체 개요 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              푼 문제
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalQuestions}개</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 시도
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalAttempts}회</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              정답률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {overview.accuracy.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              연속 학습
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {overview.streak}일
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 카테고리별 통계 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>카테고리별 성과</CardTitle>
          <CardDescription>
            각 카테고리별 정답률과 문제 수를 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              아직 학습한 카테고리가 없습니다
            </div>
          ) : (
            <>
              {/* 차트 */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="정답" fill="#10b981" />
                  <Bar dataKey="오답" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>

              {/* 테이블 */}
              <div className="mt-6 space-y-2">
                {categoryStats.map((stat) => (
                  <div 
                    key={stat.category} 
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{stat.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {stat.total}문제 / {stat.attempts}회 시도
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm">
                        <span className="text-green-500 font-medium">{stat.correct}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-red-500 font-medium">{stat.total - stat.correct}</span>
                      </div>
                      <Badge variant="secondary">
                        {stat.accuracy.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 난이도별 통계 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>난이도별 분석</CardTitle>
          <CardDescription>
            각 난이도별 학습 현황을 파악하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {difficultyStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              아직 통계가 없습니다
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 파이 차트 */}
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={difficultyPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {difficultyPieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getDifficultyColor(entry.name)} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 난이도별 상세 */}
              <div className="space-y-3">
                {difficultyStats.map((stat) => (
                  <Card key={stat.difficulty}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline"
                          className={`text-xs`}
                          style={{ 
                            color: getDifficultyColor(stat.difficulty),
                            borderColor: getDifficultyColor(stat.difficulty) + '40'
                          }}
                        >
                          {stat.difficulty}
                        </Badge>
                        <span className="text-lg font-bold">
                          {stat.accuracy.toFixed(1)}%
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{stat.total}문제</span>
                        <span>{stat.correct}개 정답</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
          <CardDescription>
            최근에 푼 문제 10개
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              아직 풀이 기록이 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity, index) => (
                <div 
                  key={`${activity.questionId}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-1">
                    {activity.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-2">
                      {activity.question}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.category}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ color: getDifficultyColor(activity.difficulty) }}
                      >
                        {activity.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {activity.lastAttemptedAt 
                          ? new Date(activity.lastAttemptedAt).toLocaleDateString('ko-KR')
                          : '날짜 없음'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 일별 통계 차트 */}
      <DailyStatsChart days={7} />
    </div>
  )
}

