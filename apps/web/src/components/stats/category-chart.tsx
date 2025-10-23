'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface CategoryData {
  category: string
  total: number
  correct: number
  accuracy: number
}

interface CategoryChartProps {
  data: CategoryData[]
}

const COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', 
  '#10b981', '#06b6d4', '#6366f1', '#14b8a6'
]

export function CategoryChart({ data }: CategoryChartProps) {
  // 카테고리명을 짧게 변환
  const chartData = data.map((item) => ({
    ...item,
    name: item.category.length > 10 ? item.category.substring(0, 10) + '...' : item.category,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>카테고리별 정답률</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as CategoryData
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="font-semibold">{data.category}</p>
                      <p className="text-sm text-muted-foreground">
                        정답률: {data.accuracy.toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {data.correct} / {data.total}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}


