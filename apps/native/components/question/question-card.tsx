/**
 * QuestionCard Native Component
 * Web의 QuestionCard를 Native로 이식
 */

import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { CodeBlock } from "./code-block";
import { AnswerOptions } from "./answer-options";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/utils/trpc";
import { showToast } from "@/utils/toast";
import { useState } from "react";

interface Question {
	id: string;
	category: string;
	question: string;
	options: string[];
	correctAnswer: number;
	explanation: string;
	code: string | null;
	difficulty: string;
}

interface QuestionCardProps {
	question: Question;
	selectedAnswer: number | null;
	onAnswerSelect: (index: number) => void;
	showAnswer?: boolean;
	questionNumber?: number;
	totalQuestions?: number;
	showBookmark?: boolean;
}

export function QuestionCard({
	question,
	selectedAnswer,
	onAnswerSelect,
	showAnswer = false,
	questionNumber,
	totalQuestions,
	showBookmark = true,
}: QuestionCardProps) {
	const [localIsBookmarked, setLocalIsBookmarked] = useState(false);

	// FIX-0008: 북마크 상태 확인 (기본값 가드)
	const { data: isBookmarked = false } = trpc.bookmark.check.useQuery(
		{ questionId: question.id },
		{ enabled: showBookmark }
	);

	// 북마크 토글
	const utils = trpc.useUtils();
	const toggleBookmark = trpc.bookmark.toggle.useMutation({
		onMutate: async () => {
			// Optimistic update
			setLocalIsBookmarked(!isBookmarked);
		},
		onSuccess: (data) => {
			// 성공 후 캐시 무효화
			utils.bookmark.check.invalidate({ questionId: question.id });
			utils.bookmark.getAll.invalidate();
			utils.bookmark.getBookmarkedQuestions.invalidate();

			showToast.success(
				data.isBookmarked ? "북마크에 추가했습니다 ⭐" : "북마크를 해제했습니다"
			);
			setLocalIsBookmarked(data.isBookmarked);
		},
		onError: (error) => {
			// 에러 시 롤백
			setLocalIsBookmarked(isBookmarked);
			showToast.error("북마크 변경 실패: " + error.message);
		},
	});

	const handleBookmarkClick = () => {
		toggleBookmark.mutate({ questionId: question.id });
	};

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty.toLowerCase()) {
			case "easy":
				return {
					bg: "bg-green-500/10",
					text: "text-green-600 dark:text-green-400",
					border: "border-green-500/20",
				};
			case "medium":
				return {
					bg: "bg-amber-500/10",
					text: "text-amber-600 dark:text-amber-400",
					border: "border-amber-500/20",
				};
			case "hard":
				return {
					bg: "bg-red-500/10",
					text: "text-red-600 dark:text-red-400",
					border: "border-red-500/20",
				};
			default:
				return { bg: "bg-muted", text: "text-foreground", border: "border-border" };
		}
	};

	const difficultyStyle = getDifficultyColor(question.difficulty);
	const displayIsBookmarked = localIsBookmarked || isBookmarked;

	return (
		<View className="bg-card rounded-xl border border-border overflow-hidden">
			{/* Header */}
			<View className="p-4 border-b border-border">
				<View className="flex-row items-start justify-between mb-3">
					{/* Badges */}
					<View className="flex-row flex-wrap gap-2 flex-1">
						<View className="px-3 py-1 rounded-full border border-border bg-background">
							<Text className="text-xs text-foreground">{question.category}</Text>
						</View>
						<View
							className={`px-3 py-1 rounded-full border ${difficultyStyle.border} ${difficultyStyle.bg}`}
						>
							<Text className={`text-xs ${difficultyStyle.text}`}>
								{question.difficulty}
							</Text>
						</View>
					</View>

					{/* Question Number & Bookmark */}
					<View className="flex-row items-center gap-2">
						{questionNumber && totalQuestions && (
							<Text className="text-sm text-muted-foreground">
								{questionNumber} / {totalQuestions}
							</Text>
						)}
						{showBookmark && (
							<TouchableOpacity
								onPress={handleBookmarkClick}
								disabled={toggleBookmark.isPending}
								className="p-2"
							>
								{toggleBookmark.isPending ? (
									<ActivityIndicator size="small" color="#F59E0B" />
								) : (
									<Ionicons
										name={displayIsBookmarked ? "bookmark" : "bookmark-outline"}
										size={20}
										color={displayIsBookmarked ? "#F59E0B" : "#9CA3AF"}
									/>
								)}
							</TouchableOpacity>
						)}
					</View>
				</View>

				{/* Question Text */}
				<Text className="text-lg font-semibold text-foreground leading-7">
					{question.question}
				</Text>
			</View>

			{/* Content */}
			<View className="p-4 gap-6">
				{/* Code Block */}
				{question.code && <CodeBlock code={question.code} />}

				{/* Answer Options */}
				<AnswerOptions
					options={question.options}
					selectedAnswer={selectedAnswer}
					correctAnswer={showAnswer ? question.correctAnswer : undefined}
					onSelect={onAnswerSelect}
					disabled={showAnswer}
				/>

				{/* Explanation */}
				{showAnswer && (
					<View className="p-4 rounded-lg bg-muted/50 border border-border">
						<View className="flex-row items-center gap-2 mb-2">
							<Text className="text-base">💡</Text>
							<Text className="text-base font-semibold text-foreground">해설</Text>
						</View>
						<Text className="text-sm leading-6 text-muted-foreground">
							{question.explanation}
						</Text>
					</View>
				)}
			</View>
		</View>
	);
}

