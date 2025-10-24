/**
 * Category Selection Screen (Native)
 * 카테고리 선택 화면
 */

import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/utils/trpc";
import { Ionicons } from "@expo/vector-icons";
import { Container } from "@/components/container";

export default function CategorySelectionScreen() {
	const router = useRouter();

	// FIX-0008: 카테고리별 통계 가져오기 (기본값 가드)
	const { data: categoryStats = [], isLoading } = trpc.stats.getByCategory.useQuery();

	if (isLoading) {
		return (
			<Container>
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color="#6366F1" />
					<Text className="mt-4 text-muted-foreground">카테고리를 불러오는 중...</Text>
				</View>
			</Container>
		);
	}

	if (!categoryStats || categoryStats.length === 0) {
		return (
			<Container>
				<View className="flex-1 justify-center items-center p-6">
					<Ionicons name="folder-open-outline" size={48} color="#9CA3AF" />
					<Text className="text-2xl font-bold text-foreground mb-2 mt-4">
						카테고리가 없습니다
					</Text>
					<Text className="text-muted-foreground text-center">
						문제를 추가하면 카테고리가 표시됩니다
					</Text>
				</View>
			</Container>
		);
	}

	return (
		<Container>
			<ScrollView className="flex-1 p-6">
				<View className="py-4">
					<Text className="text-2xl font-bold text-foreground mb-2">
						카테고리 선택
					</Text>
					<Text className="text-muted-foreground">
						학습하고 싶은 카테고리를 선택하세요
					</Text>
				</View>

				<View className="gap-3">
					{categoryStats.map((category) => {
						const accuracy =
							category.total > 0
								? Math.round((category.correct / category.total) * 100)
								: 0;

						return (
							<TouchableOpacity
								key={category.category}
								onPress={() => {
									// TODO: 카테고리별 학습 화면으로 이동
									// router.push(`/study/category/${category.category}`);
								}}
								className="p-4 bg-card rounded-lg border border-border"
							>
								<View className="flex-row items-center justify-between mb-2">
									<View className="flex-row items-center gap-2">
										<Ionicons name="folder-open" size={20} color="#6366F1" />
										<Text className="text-lg font-semibold text-foreground">
											{category.category}
										</Text>
									</View>
									<View
										className={`px-3 py-1 rounded-full ${
											accuracy >= 80
												? "bg-green-500/10"
												: accuracy >= 60
												? "bg-amber-500/10"
												: "bg-red-500/10"
										}`}
									>
										<Text
											className={`text-xs font-semibold ${
												accuracy >= 80
													? "text-green-600 dark:text-green-400"
													: accuracy >= 60
													? "text-amber-600 dark:text-amber-400"
													: "text-red-600 dark:text-red-400"
											}`}
										>
											{accuracy}%
										</Text>
									</View>
								</View>

								<View className="flex-row items-center gap-4">
									<Text className="text-sm text-muted-foreground">
										총 {category.total}문제
									</Text>
									<Text className="text-sm text-green-600 dark:text-green-400">
										정답 {category.correct}
									</Text>
									<Text className="text-sm text-red-600 dark:text-red-400">
										오답 {category.total - category.correct}
									</Text>
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>
		</Container>
	);
}

