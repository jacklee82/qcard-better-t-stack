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

	// FIX-0020: 전체 카테고리 목록 가져오기 (진행 기록 무관)
	const { data: categories = [], isLoading } = trpc.question.getCategories.useQuery();

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

	if (!categories || categories.length === 0) {
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
					{categories.map((category) => {
						return (
							<TouchableOpacity
								key={category}
								onPress={() => {
									// TODO: 카테고리별 학습 화면으로 이동
									// router.push(`/study/category/${category}`);
								}}
								className="p-4 bg-card rounded-lg border border-border"
							>
								<View className="flex-row items-center justify-between mb-2">
									<View className="flex-row items-center gap-2">
										<Ionicons name="folder-open" size={20} color="#6366F1" />
										<Text className="text-lg font-semibold text-foreground">
											{category}
										</Text>
									</View>
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>
		</Container>
	);
}

