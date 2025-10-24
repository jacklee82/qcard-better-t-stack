import { Container } from "@/components/container";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import { trpc } from "@/utils/trpc";
import { Ionicons } from "@expo/vector-icons";
import { CategoryChart } from "@/components/charts/category-chart";
import { DailyStatsChart } from "@/components/charts/daily-stats-chart";
import { GoalCard } from "@/components/stats/goal-card";

export default function StatsScreen() {
	// FIX-0008: 배열 기본값 가드
	const { data: stats, isLoading: statsLoading } = trpc.stats.getOverview.useQuery();
	const { data: categoryStats = [], isLoading: categoryLoading } = 
		trpc.stats.getByCategory.useQuery();
	const { data: dailyStats = [] } = trpc.stats.getDailyStats.useQuery({ days: 7 });

	if (statsLoading || categoryLoading) {
		return (
			<Container>
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color="hsl(221.2 83.2% 53.3%)" />
				</View>
			</Container>
		);
	}

	return (
		<Container>
			<ScrollView className="flex-1">
				{/* 헤더 */}
				<View className="p-6 pb-4">
					<Text className="text-3xl font-bold text-foreground mb-2">
						학습 통계
					</Text>
					<Text className="text-muted-foreground">
						나의 학습 현황을 확인하세요
					</Text>
				</View>

				{/* 전체 통계 */}
				<View className="px-6 pb-4">
					<Text className="text-lg font-semibold text-foreground mb-3">
						전체 현황
					</Text>
					<View className="p-5 bg-card rounded-xl border border-border">
						<View className="flex-row items-center justify-between mb-4">
							<View className="flex-1">
								<Text className="text-muted-foreground text-sm mb-1">
									전체 정답률
								</Text>
								<Text className="text-3xl font-bold text-foreground">
									{stats?.accuracy.toFixed(1)}%
								</Text>
							</View>
							<View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center">
								<Ionicons name="trophy" size={32} color="hsl(221.2 83.2% 53.3%)" />
							</View>
						</View>
						<View className="flex-row justify-between pt-4 border-t border-border">
							<View>
								<Text className="text-muted-foreground text-xs mb-1">
									정답
								</Text>
								<Text className="text-green-500 font-bold text-lg">
									{stats?.correctAnswers}
								</Text>
							</View>
							<View>
								<Text className="text-muted-foreground text-xs mb-1">
									오답
								</Text>
								<Text className="text-red-500 font-bold text-lg">
									{(stats?.totalAttempts || 0) - (stats?.correctAnswers || 0)}
								</Text>
							</View>
							<View>
								<Text className="text-muted-foreground text-xs mb-1">
									총 문제
								</Text>
								<Text className="text-foreground font-bold text-lg">
									{stats?.totalQuestions}
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* 카테고리별 통계 */}
				{categoryStats && categoryStats.length > 0 && (
					<View className="px-6 pb-6">
						<Text className="text-lg font-semibold text-foreground mb-3">
							카테고리별 현황
						</Text>
						<View className="gap-3">
							{categoryStats.map((category, index) => {
								const accuracy = category.total > 0 
									? (category.correct / category.total) * 100 
									: 0;
								
								return (
									<View
										key={index}
										className="p-4 bg-card rounded-lg border border-border"
									>
										<View className="flex-row items-center justify-between mb-2">
											<Text className="text-foreground font-medium flex-1" numberOfLines={1}>
												{category.category}
											</Text>
											<Text className="text-foreground font-bold">
												{accuracy.toFixed(0)}%
											</Text>
										</View>
										<View className="flex-row items-center">
											<View className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
												<View
													className={`h-full ${
														accuracy >= 80
															? "bg-green-500"
															: accuracy >= 60
															? "bg-amber-500"
															: "bg-red-500"
													}`}
													style={{ width: `${accuracy}%` }}
												/>
											</View>
											<Text className="text-xs text-muted-foreground ml-3">
												{category.correct}/{category.total}
											</Text>
										</View>
									</View>
								);
							})}
						</View>
					</View>
				)}

				{/* 학습 목표 */}
				<View className="px-6 pb-4">
					<GoalCard />
				</View>

				{/* 카테고리 차트 */}
				{categoryStats && categoryStats.length > 0 && (
					<View className="px-6 pb-4">
						<CategoryChart data={categoryStats} />
					</View>
				)}

				{/* 일별 통계 차트 */}
				{dailyStats && dailyStats.length > 0 && (
					<View className="px-6 pb-6">
						<DailyStatsChart data={dailyStats} days={7} />
					</View>
				)}
			</ScrollView>
		</Container>
	);
}

