"use client";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { StatCard } from "@/components/stats/stat-card";
import { CategoryChart } from "@/components/stats/category-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, BookOpen, Flame, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	const { data: stats, isLoading: statsLoading } = trpc.stats.getOverview.useQuery();
	const { data: categoryStats, isLoading: categoryLoading } = trpc.stats.getByCategory.useQuery();
	const { data: recentActivity, isLoading: activityLoading } = trpc.stats.getRecentActivity.useQuery({ limit: 5 });

	if (statsLoading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-32" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* 환영 메시지 */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">안녕하세요, {session.user.name}님! 👋</h1>
					<p className="text-muted-foreground mt-1">오늘도 열심히 학습해볼까요?</p>
				</div>
				<Link href="/study">
					<Button size="lg">학습 시작하기</Button>
				</Link>
			</div>

			{/* 통계 카드 */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<StatCard
					title="전체 정답률"
					value={`${stats?.accuracy.toFixed(1)}%`}
					icon={Target}
					description={`${stats?.correctAnswers} / ${stats?.totalAttempts} 정답`}
				/>
				<StatCard
					title="학습한 문제"
					value={stats?.totalQuestions || 0}
					icon={BookOpen}
					description="전체 200문제 중"
				/>
				<StatCard
					title="연속 학습일"
					value={`${stats?.streak || 0}일`}
					icon={Flame}
					description={stats?.lastStudiedAt ? '계속 도전하세요!' : '학습을 시작해보세요'}
				/>
			</div>

			{/* 카테고리별 차트 */}
			{categoryStats && categoryStats.length > 0 && (
				<CategoryChart data={categoryStats} />
			)}

			{/* 최근 활동 */}
			{recentActivity && recentActivity.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>최근 활동</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{recentActivity.map((activity, index) => (
								<div
									key={index}
									className="flex items-center justify-between p-3 rounded-lg border"
								>
									<div className="flex-1">
										<p className="font-medium text-sm line-clamp-1">
											{activity.question}
										</p>
										<div className="flex items-center gap-2 mt-1">
											<span className="text-xs text-muted-foreground">
												{activity.category}
											</span>
											<span className="text-xs text-muted-foreground">•</span>
											<span className="text-xs text-muted-foreground">
												{activity.difficulty}
											</span>
										</div>
									</div>
									<div className={`px-3 py-1 rounded-full text-xs font-medium ${
										activity.isCorrect 
											? 'bg-green-500/10 text-green-500' 
											: 'bg-red-500/10 text-red-500'
									}`}>
										{activity.isCorrect ? '정답' : '오답'}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* 빠른 액션 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card className="hover:shadow-md transition-shadow cursor-pointer">
					<Link href="/study/random">
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
									<TrendingUp className="w-6 h-6 text-purple-500" />
								</div>
								<div>
									<h3 className="font-semibold">랜덤 학습</h3>
									<p className="text-sm text-muted-foreground">
										무작위 문제로 실력 테스트
									</p>
								</div>
							</div>
						</CardContent>
					</Link>
				</Card>

				<Card className="hover:shadow-md transition-shadow cursor-pointer">
					<Link href="/study/review">
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
									<Clock className="w-6 h-6 text-amber-500" />
								</div>
								<div>
									<h3 className="font-semibold">복습하기</h3>
									<p className="text-sm text-muted-foreground">
										틀렸던 문제 다시 풀기
									</p>
								</div>
							</div>
						</CardContent>
					</Link>
				</Card>
			</div>
		</div>
	);
}
