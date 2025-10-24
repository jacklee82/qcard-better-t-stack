import { Container } from "@/components/container";
import { ScrollView, Text, View, ActivityIndicator, TouchableOpacity } from "react-native";
import { trpc } from "@/utils/trpc";
import { Ionicons } from "@expo/vector-icons";
import { QuestionCard } from "@/components/question/question-card";
import { useState } from "react";
import { useRouter } from "expo-router";

export default function BookmarksScreen() {
	const router = useRouter();
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
	const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

	// FIX-0008: 배열 기본값 가드
	const { data: bookmarkedQuestions = [], isLoading } = 
		trpc.bookmark.getBookmarkedQuestions.useQuery();

	// 카테고리 목록 추출
	const categories = Array.from(new Set(bookmarkedQuestions.map(q => q.category)));
	const difficulties = ["easy", "medium", "hard"];

	// 필터링된 문제
	const filteredQuestions = bookmarkedQuestions.filter(q => {
		if (selectedCategory && q.category !== selectedCategory) return false;
		if (selectedDifficulty && q.difficulty !== selectedDifficulty) return false;
		return true;
	});

	if (isLoading) {
		return (
			<Container>
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color="#6366F1" />
					<Text className="mt-4 text-muted-foreground">북마크를 불러오는 중...</Text>
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
						북마크
					</Text>
					<Text className="text-muted-foreground">
						저장한 문제 {bookmarkedQuestions.length}개
					</Text>
				</View>

				{/* 빈 상태 */}
				{bookmarkedQuestions.length === 0 ? (
					<View className="flex-1 items-center justify-center px-6 py-12">
						<View className="w-20 h-20 bg-muted rounded-full items-center justify-center mb-4">
							<Ionicons name="bookmark-outline" size={40} color="#9CA3AF" />
						</View>
						<Text className="text-foreground font-semibold text-lg mb-2">
							북마크가 없습니다
						</Text>
						<Text className="text-muted-foreground text-center">
							중요한 문제를 북마크하여{"\n"}나중에 다시 확인하세요
						</Text>
					</View>
				) : (
					<>
						{/* 필터 */}
						<View className="px-6 pb-4">
							{/* 카테고리 필터 */}
							<Text className="text-sm font-semibold text-foreground mb-2">
								카테고리
							</Text>
							<ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
								<View className="flex-row gap-2">
									<TouchableOpacity
										onPress={() => setSelectedCategory(null)}
										className={`px-4 py-2 rounded-full border ${
											selectedCategory === null
												? "bg-primary border-primary"
												: "bg-card border-border"
										}`}
									>
										<Text
											className={`text-sm font-medium ${
												selectedCategory === null
													? "text-primary-foreground"
													: "text-foreground"
											}`}
										>
											전체
										</Text>
									</TouchableOpacity>
									{categories.map((category) => (
										<TouchableOpacity
											key={category}
											onPress={() => setSelectedCategory(category)}
											className={`px-4 py-2 rounded-full border ${
												selectedCategory === category
													? "bg-primary border-primary"
													: "bg-card border-border"
											}`}
										>
											<Text
												className={`text-sm font-medium ${
													selectedCategory === category
														? "text-primary-foreground"
														: "text-foreground"
												}`}
											>
												{category}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							</ScrollView>

							{/* 난이도 필터 */}
							<Text className="text-sm font-semibold text-foreground mb-2">
								난이도
							</Text>
							<View className="flex-row gap-2">
								<TouchableOpacity
									onPress={() => setSelectedDifficulty(null)}
									className={`flex-1 px-4 py-2 rounded-lg border ${
										selectedDifficulty === null
											? "bg-primary border-primary"
											: "bg-card border-border"
									}`}
								>
									<Text
										className={`text-sm font-medium text-center ${
											selectedDifficulty === null
												? "text-primary-foreground"
												: "text-foreground"
										}`}
									>
										전체
									</Text>
								</TouchableOpacity>
								{difficulties.map((difficulty) => (
									<TouchableOpacity
										key={difficulty}
										onPress={() => setSelectedDifficulty(difficulty)}
										className={`flex-1 px-4 py-2 rounded-lg border ${
											selectedDifficulty === difficulty
												? difficulty === "easy"
													? "bg-green-500/20 border-green-500"
													: difficulty === "medium"
													? "bg-amber-500/20 border-amber-500"
													: "bg-red-500/20 border-red-500"
												: "bg-card border-border"
										}`}
									>
										<Text
											className={`text-sm font-medium text-center ${
												selectedDifficulty === difficulty
													? difficulty === "easy"
														? "text-green-600 dark:text-green-400"
														: difficulty === "medium"
														? "text-amber-600 dark:text-amber-400"
														: "text-red-600 dark:text-red-400"
													: "text-foreground"
											}`}
										>
											{difficulty === "easy" ? "쉬움" : difficulty === "medium" ? "보통" : "어려움"}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>

						{/* 필터링된 결과 */}
						{filteredQuestions.length === 0 ? (
							<View className="flex-1 items-center justify-center px-6 py-12">
								<Ionicons name="filter-outline" size={40} color="#9CA3AF" />
								<Text className="text-foreground font-semibold text-lg mb-2 mt-4">
									해당하는 문제가 없습니다
								</Text>
								<Text className="text-muted-foreground text-center">
									다른 필터를 선택해보세요
								</Text>
							</View>
						) : (
							<View className="px-6 pb-6 gap-4">
								{filteredQuestions.map((question) => (
									<View key={question.id}>
										<QuestionCard
											question={question}
											selectedAnswer={null}
											onAnswerSelect={() => {}}
											showAnswer={expandedQuestionId === question.id}
											showBookmark={true}
										/>
										<View className="flex-row gap-2 mt-2">
											<TouchableOpacity
												onPress={() =>
													setExpandedQuestionId(
														expandedQuestionId === question.id ? null : question.id
													)
												}
												className="flex-1 p-3 bg-card rounded-lg border border-border"
											>
												<Text className="text-foreground font-medium text-center">
													{expandedQuestionId === question.id ? "해설 닫기" : "해설 보기"}
												</Text>
											</TouchableOpacity>
										</View>
									</View>
								))}
							</View>
						)}
					</>
				)}
			</ScrollView>
		</Container>
	);
}

