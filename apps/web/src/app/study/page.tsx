'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Shuffle, FolderOpen, RotateCcw } from 'lucide-react'

export default function StudyPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">학습 모드 선택</h1>
        <p className="text-muted-foreground">
          원하는 방식으로 Python/데이터 분석을 학습하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 순차 학습 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>순차 학습</CardTitle>
            <CardDescription>
              처음부터 끝까지 순서대로 문제를 풀어보세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/study/sequential">
              <Button className="w-full">시작하기</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 랜덤 학습 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <Shuffle className="w-6 h-6 text-purple-500" />
            </div>
            <CardTitle>랜덤 학습</CardTitle>
            <CardDescription>
              무작위로 섞인 문제로 실력을 테스트하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/study/random">
              <Button variant="outline" className="w-full">시작하기</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 카테고리별 학습 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <FolderOpen className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle>카테고리별 학습</CardTitle>
            <CardDescription>
              특정 주제에 집중해서 학습하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/study/category">
              <Button variant="outline" className="w-full">시작하기</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 복습 모드 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6 text-amber-500" />
            </div>
            <CardTitle>복습 모드</CardTitle>
            <CardDescription>
              틀렸던 문제를 다시 풀어보세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/study/review">
              <Button variant="outline" className="w-full">시작하기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


