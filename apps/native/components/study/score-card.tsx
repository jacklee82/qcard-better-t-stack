/**
 * ScoreCard Native Component
 * 학습 결과 화면
 */

import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface ScoreCardProps {
	totalQuestions: number;
	correctAnswers: number;
	mode: string;
	duration?: number;
	onRetry?: () => void;
}

export function ScoreCard({
	totalQuestions,
	correctAnswers,
	mode,
	duration,
	onRetry,
}: ScoreCardProps) {
	const router = useRouter();
	const incorrectAnswers = totalQuestions - correctAnswers;
	const accuracy =
		totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

	const getGrade = (accuracy: number) => {
		if (accuracy >= 90)
			return { text: "완벽해요!", emoji: "🏆", color: "#F59E0B" };
		if (accuracy >= 80)
			return { text: "훌륭해요!", emoji: "🎉", color: "#22C55E" };
		if (accuracy >= 70)
			return { text: "잘했어요!", emoji: "👏", color: "#3B82F6" };
		if (accuracy >= 60)
			return { text: "좋아요!", emoji: "👍", color: "#6366F1" };
		return { text: "다시 도전!", emoji: "💪", color: "#9CA3AF" };
	};

	const grade = getGrade(accuracy);

	const formatDuration = (seconds: number = 0) => {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes}분 ${secs}초`;
	};

	const getModeText = (mode: string) => {
		switch (mode) {
			case "sequential":
				return "순차 학습";
			case "random":
				return "랜덤 학습";
			case "category":
				return "카테고리 학습";
			case "review":
				return "복습";
			default:
				return "학습";
		}
	};

	return (
		<ScrollView className="flex-1 bg-background">
			<View className="container max-w-2xl mx-auto py-8 px-4">
				{/* Header */}
				<View className="bg-card rounded-xl border border-border overflow-hidden">
					{/* Trophy Icon */}
					<View className="items-center pt-6 pb-4">
						<View
							className="w-20 h-20 rounded-full items-center justify-center"
							style={{ backgroundColor: `${grade.color}20` }}
						>
							<Ionicons name="trophy" size={48} color={grade.color} />
						</View>
					</View>

					{/* Title */}
					<View className="items-center pb-4">
						<Text className="text-3xl font-bold text-foreground mb-2">
							{grade.text} {grade.emoji}
						</Text>
						<Text className="text-lg text-muted-foreground">
							{getModeText(mode)} 완료
						</Text>
					</View>

					{/* Content */}
					<View className="p-4 gap-6">
						{/* 정답률 */}
						<View className="p-6 bg-muted/50 rounded-xl items-center">
							<Text
								className="text-5xl font-bold mb-2"
								style={{ color: grade.color }}
							>
								{accuracy}%
							</Text>
							<Text className="text-sm text-muted-foreground">정답률</Text>
						</View>

						{/* 상세 통계 */}
						<View className="gap-3">
							{/* 정답 & 오답 */}
							<View className="flex-row gap-3">
								<View className="flex-1 p-4 bg-card rounded-lg border border-border">
									<View className="flex-row items-center gap-3">
										<Ionicons name="checkmark-circle" size={32} color="#22C55E" />
										<View>
											<Text className="text-2xl font-bold text-green-500">
												{correctAnswers}
											</Text>
											<Text className="text-xs text-muted-foreground">정답</Text>
										</View>
									</View>
								</View>

								<View className="flex-1 p-4 bg-card rounded-lg border border-border">
									<View className="flex-row items-center gap-3">
										<Ionicons name="close-circle" size={32} color="#EF4444" />
										<View>
											<Text className="text-2xl font-bold text-red-500">
												{incorrectAnswers}
											</Text>
											<Text className="text-xs text-muted-foreground">오답</Text>
										</View>
									</View>
								</View>
							</View>

							{/* 총 문제 & 소요 시간 */}
							<View className="flex-row gap-3">
								<View className="flex-1 p-4 bg-card rounded-lg border border-border">
									<View className="flex-row items-center gap-3">
										<Ionicons name="list" size={32} color="#3B82F6" />
										<View>
											<Text className="text-2xl font-bold text-blue-500">
												{totalQuestions}
											</Text>
											<Text className="text-xs text-muted-foreground">총 문제</Text>
										</View>
									</View>
								</View>

								{duration !== undefined && (
									<View className="flex-1 p-4 bg-card rounded-lg border border-border">
										<View className="flex-row items-center gap-3">
											<Ionicons name="time" size={32} color="#A855F7" />
											<View>
												<Text className="text-lg font-bold text-purple-500">
													{formatDuration(duration)}
												</Text>
												<Text className="text-xs text-muted-foreground">
													소요 시간
												</Text>
											</View>
										</View>
									</View>
								)}
							</View>
						</View>

						{/* 액션 버튼 */}
						<View className="gap-3 pt-4">
							{/* 대시보드로 이동 */}
							<TouchableOpacity
								onPress={() => router.push("/dashboard")}
								className="p-4 bg-primary rounded-lg"
							>
								<Text className="text-primary-foreground font-semibold text-center text-base">
									대시보드로 이동
								</Text>
							</TouchableOpacity>

							{/* 다시 풀기 & 오답 복습 */}
							<View className="flex-row gap-3">
								{onRetry && (
									<TouchableOpacity
										onPress={onRetry}
										className="flex-1 p-4 bg-card rounded-lg border border-border"
									>
										<Text className="text-foreground font-medium text-center">
											다시 풀기
										</Text>
									</TouchableOpacity>
								)}
								{incorrectAnswers > 0 && (
									<TouchableOpacity
										onPress={() => router.push("/study/review")}
										className="flex-1 p-4 bg-card rounded-lg border border-border"
									>
										<Text className="text-foreground font-medium text-center">
											오답 복습
										</Text>
									</TouchableOpacity>
								)}
							</View>

							{/* 다른 학습 모드 */}
							<TouchableOpacity
								onPress={() => router.push("/study")}
								className="p-4"
							>
								<Text className="text-muted-foreground text-center">
									다른 학습 모드
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</View>
		</ScrollView>
	);
}

