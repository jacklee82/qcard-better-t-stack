'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/utils/trpc'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar } from 'lucide-react'

interface DailyStatsChartProps {
  days?: number
}

export function DailyStatsChart({ days = 7 }: DailyStatsChartProps) {
  // 일별 통계 가져오기 (FIX-0008: 기본값 가드)
  const { data: dailyStats = [], isLoading } = trpc.stats.getDailyStats.useQuery({ days })

  // 데이터 변환
  const chartData = dailyStats.map((stat) => ({
    date: stat.date,
    displayDate: formatDate(stat.date),
    학습한문제: stat.total,
    정답: stat.correct,
    오답: stat.total - stat.correct,
    정답률: stat.accuracy,
  }))

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-2">{payload[0].payload.displayDate}</p>
          <div className="space-y-1">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              학습한 문제: {payload[0].payload.학습한문제}개
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              정답: {payload[0].payload.정답}개
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              오답: {payload[0].payload.오답}개
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              정답률: {payload[0].payload.정답률.toFixed(1)}%
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            최근 {days}일 학습 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            로딩 중...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            최근 {days}일 학습 현황
          </CardTitle>
          <CardDescription>
            일별 학습 추이를 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">아직 학습 기록이 없습니다</p>
              <p className="text-sm text-muted-foreground">
                학습을 시작하면 여기에 통계가 표시됩니다
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          최근 {days}일 학습 현황
        </CardTitle>
        <CardDescription>
          일별 학습 문제 수와 정답률을 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="displayDate"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="학습한문제" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="정답" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="오답" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* 요약 정보 */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {chartData.reduce((sum, stat) => sum + stat.학습한문제, 0)}
            </p>
            <p className="text-xs text-muted-foreground">총 학습 문제</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {chartData.reduce((sum, stat) => sum + stat.정답, 0)}
            </p>
            <p className="text-xs text-muted-foreground">총 정답</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(chartData.reduce((sum, stat) => sum + stat.정답률, 0) / chartData.length).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">평균 정답률</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

