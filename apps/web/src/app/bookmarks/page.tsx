'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/utils/trpc'
import Loader from '@/components/loader'
import { useRouter } from 'next/navigation'
import { Bookmark, BookmarkX, ArrowLeft, Play } from 'lucide-react'
import { toast } from 'sonner'

export default function BookmarksPage() {
  const router = useRouter()
  
  // 북마크된 문제 목록 가져오기 (FIX-0008: 기본값 가드)
  const { data: bookmarkedQuestions = [], isLoading } =
    trpc.bookmark.getBookmarkedQuestions.useQuery()

  const utils = trpc.useUtils()
  const removeBookmark = trpc.bookmark.toggle.useMutation({
    onSuccess: () => {
      // 캐시 무효화
      utils.bookmark.getBookmarkedQuestions.invalidate()
      utils.bookmark.getAll.invalidate()
      toast.success('북마크를 해제했습니다')
    },
    onError: (error) => {
      toast.error('북마크 해제 실패: ' + error.message)
    }
  })

  const handleRemoveBookmark = (questionId: string) => {
    removeBookmark.mutate({ questionId })
  }

  const handleStartStudy = (questionId: string) => {
    // TODO: 특정 문제로 바로 이동하는 학습 페이지 구현
    router.push('/study/sequential')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'hard':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-muted'
    }
  }

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
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          대시보드로 돌아가기
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Bookmark className="w-8 h-8 text-amber-500 fill-amber-500" />
          <h1 className="text-3xl font-bold">북마크</h1>
        </div>
        <p className="text-muted-foreground">
          저장한 문제를 다시 확인하고 복습하세요
        </p>
      </div>

      {/* 북마크 목록 */}
      {bookmarkedQuestions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <BookmarkX className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">북마크한 문제가 없습니다</h2>
          <p className="text-muted-foreground mb-6">
            학습 중 중요한 문제를 북마크하면 여기에 표시됩니다
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/study/sequential')}>
              순차 학습 시작
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/study/random')}
            >
              랜덤 학습 시작
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              총 {bookmarkedQuestions.length}개의 문제
            </p>
          </div>

          {bookmarkedQuestions.map(({ bookmark, question }) => {
            if (!question) return null

            return (
              <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {question.category}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getDifficultyColor(question.difficulty)}`}
                        >
                          {question.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mb-2">
                        {question.question}
                      </CardTitle>
                      {bookmark.note && (
                        <CardDescription className="mt-2">
                          📝 {bookmark.note}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveBookmark(question.id)}
                        disabled={removeBookmark.isPending}
                        title="북마크 해제"
                      >
                        <BookmarkX className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStartStudy(question.id)}
                      className="flex items-center gap-2"
                    >
                      <Play className="w-3 h-3" />
                      학습하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

