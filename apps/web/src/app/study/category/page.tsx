'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trpc } from '@/utils/trpc'
import Loader from '@/components/loader'
import { FolderOpen, ArrowLeft } from 'lucide-react'

export default function CategorySelectPage() {
  const router = useRouter()
  
  // 카테고리 목록 가져오기 (FIX-0008: 기본값 가드)
  const { data: categories = [], isLoading } = trpc.question.getCategories.useQuery()

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Loader />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/study')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          학습 모드로 돌아가기
        </Button>

        <h1 className="text-3xl font-bold mb-2">카테고리 선택</h1>
        <p className="text-muted-foreground">
          집중하고 싶은 주제를 선택하세요
        </p>
      </div>

      {/* 카테고리 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category, index) => (
          <Card key={category} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="flex items-center gap-2">
                {category}
              </CardTitle>
              <CardDescription>
                {category} 관련 문제를 풀어보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/study/category/${encodeURIComponent(category)}`}>
                <Button className="w-full">시작하기</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">카테고리가 없습니다</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/study')}
            className="mt-4"
          >
            돌아가기
          </Button>
        </div>
      )}
    </div>
  )
}


