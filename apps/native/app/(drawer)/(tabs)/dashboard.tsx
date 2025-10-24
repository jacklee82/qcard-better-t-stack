import { Container } from "@/components/container";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { trpc } from "@/utils/trpc";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StreakCounter } from "@/components/stats/streak-counter";
import { GoalCard } from "@/components/stats/goal-card";
import { CategoryChart } from "@/components/charts/category-chart";

export default function DashboardScreen() {
	const router = useRouter();
	
	// FIX-0008: 배열 기본값 가드
	const { data: stats, isLoading: statsLoading } = trpc.stats.getOverview.useQuery();
	const { data: recentActivity = [], isLoading: activityLoading } = 
		trpc.stats.getRecentActivity.useQuery({ limit: 5 });
	const { data: categoryStats = [] } = trpc.stats.getByCategory.useQuery();

	if (statsLoading) {
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
						안녕하세요! 👋
					</Text>
					<Text className="text-muted-foreground">
						오늘도 열심히 학습해볼까요?
					</Text>
				</View>

				{/* 통계 카드 */}
				<View className="px-6 pb-4">
					<View className="flex-row gap-3 mb-3">
						{/* 정답률 */}
						<View className="flex-1 p-4 bg-card rounded-lg border border-border">
							<View className="flex-row items-center mb-2">
								<Ionicons name="target" size={20} color="hsl(221.2 83.2% 53.3%)" />
								<Text className="ml-2 text-sm text-muted-foreground">정답률</Text>
							</View>
							<Text className="text-2xl font-bold text-foreground">
								{stats?.accuracy.toFixed(1)}%
							</Text>
							<Text className="text-xs text-muted-foreground mt-1">
								{stats?.correctAnswers} / {stats?.totalAttempts} 정답
							</Text>
						</View>

						{/* 학습한 문제 */}
						<View className="flex-1 p-4 bg-card rounded-lg border border-border">
							<View className="flex-row items-center mb-2">
								<Ionicons name="book" size={20} color="hsl(142.1 76.2% 36.3%)" />
								<Text className="ml-2 text-sm text-muted-foreground">학습 문제</Text>
							</View>
							<Text className="text-2xl font-bold text-foreground">
								{stats?.totalQuestions || 0}
							</Text>
							<Text className="text-xs text-muted-foreground mt-1">
								전체 200문제 중
							</Text>
						</View>
					</View>

					{/* 연속 학습일 */}
					<StreakCounter />
				</View>

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

				{/* 빠른 액션 */}
				<View className="px-6 pb-4">
					<Text className="text-lg font-semibold text-foreground mb-3">
						빠른 학습
					</Text>
					<View className="gap-3">
						<TouchableOpacity
							onPress={() => router.push("/(drawer)/(tabs)/study")}
							className="p-4 bg-primary rounded-lg flex-row items-center"
						>
							<View className="w-10 h-10 bg-primary-foreground/20 rounded-full items-center justify-center mr-3">
								<Ionicons name="shuffle" size={20} color="white" />
							</View>
							<View className="flex-1">
								<Text className="text-primary-foreground font-semibold text-base">
									랜덤 학습
								</Text>
								<Text className="text-primary-foreground/80 text-sm">
									무작위 문제로 실력 테스트
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={20} color="white" />
						</TouchableOpacity>

						<TouchableOpacity
							onPress={() => router.push("/(drawer)/(tabs)/study")}
							className="p-4 bg-card rounded-lg border border-border flex-row items-center"
						>
							<View className="w-10 h-10 bg-amber-500/20 rounded-full items-center justify-center mr-3">
								<Ionicons name="refresh" size={20} color="hsl(24.6 95% 53.1%)" />
							</View>
							<View className="flex-1">
								<Text className="text-foreground font-semibold text-base">
									복습하기
								</Text>
								<Text className="text-muted-foreground text-sm">
									틀렸던 문제 다시 풀기
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={20} color="hsl(240 3.8% 46.1%)" />
						</TouchableOpacity>
					</View>
				</View>

				{/* 최근 활동 */}
				{recentActivity && recentActivity.length > 0 && (
					<View className="px-6 pb-6">
						<Text className="text-lg font-semibold text-foreground mb-3">
							최근 활동
						</Text>
						<View className="gap-2">
							{recentActivity.map((activity, index) => (
								<View
									key={index}
									className="p-3 bg-card rounded-lg border border-border"
								>
									<Text
										className="text-foreground font-medium text-sm mb-1"
										numberOfLines={1}
									>
										{activity.question}
									</Text>
									<View className="flex-row items-center justify-between">
										<View className="flex-row items-center gap-2">
											<Text className="text-xs text-muted-foreground">
												{activity.category}
											</Text>
											<Text className="text-xs text-muted-foreground">•</Text>
											<Text className="text-xs text-muted-foreground">
												{activity.difficulty}
											</Text>
										</View>
										<View
											className={`px-2 py-1 rounded ${
												activity.isCorrect
													? "bg-green-500/10"
													: "bg-red-500/10"
											}`}
										>
											<Text
												className={`text-xs font-medium ${
													activity.isCorrect
														? "text-green-500"
														: "text-red-500"
												}`}
											>
												{activity.isCorrect ? "정답" : "오답"}
											</Text>
										</View>
									</View>
								</View>
							))}
						</View>
					</View>
				)}
			</ScrollView>
		</Container>
	);
}

