/**
 * Category Study Screen (Native)
 * 카테고리별 학습 화면
 */

import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { trpc } from "@/utils/trpc";
import { QuestionCard } from "@/components/question/question-card";
import { ProgressBar } from "@/components/study/progress-bar";
import { SessionTimer } from "@/components/study/session-timer";
import { ScoreCard } from "@/components/study/score-card";
import { NextButton } from "@/components/study/next-button";
import { showToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { Container } from "@/components/container";

export default function CategoryStudyScreen() {
	const router = useRouter();
	const { category } = useLocalSearchParams<{ category: string }>();
	
	// 카테고리명 디코딩 (한글 카테고리 대응)
	const decodedCategory = category ? decodeURIComponent(category) : "";
	
	const AUTO_SUBMIT = true;
	const BYPASS_AUTH = (process.env.EXPO_PUBLIC_BYPASS_AUTH ?? "true") === "true";
	const [currentIndex, setCurrentIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [showAnswer, setShowAnswer] = useState(false);
	const [correctCount, setCorrectCount] = useState(0);
	const [sessionId, setSessionId] = useState<number | null>(null);
	const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const [showScoreCard, setShowScoreCard] = useState(false);

	// 카테고리별 문제 가져오기
	const { data: questions = [], isLoading } = trpc.question.getByCategory.useQuery({ 
		category: decodedCategory 
	});

	// 세션 시작
	const startSession = trpc.session.start.useMutation({
		onSuccess: (data) => {
			setSessionId(data.sessionId);
			setSessionStartTime(new Date(data.startedAt));
		},
	});

	// 세션 종료
	const endSession = trpc.session.end.useMutation({
		onSuccess: () => {
			setShowScoreCard(true);
		},
	});

	// 페이지 진입 시 세션 시작 (BYPASS 시 스킵)
	useEffect(() => {
		if (!BYPASS_AUTH && decodedCategory) {
			startSession.mutate({ 
				mode: "category", 
				categoryFilter: decodedCategory 
			});
		} else {
			// BYPASS 모드: 로컬 타이머만 시작
			setSessionStartTime(new Date());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 답안 제출 (Optimistic UI: UI 즉시 업데이트)
	const submitAnswer = trpc.progress.submit.useMutation({
		onSuccess: () => {
			console.log("진행률 저장 완료");
		},
		onError: (error) => {
			console.error("진행률 저장 실패:", error);
		},
	});

	const handleSubmit = () => {
		if (selectedAnswer === null) {
			showToast.error("답을 선택해주세요");
			return;
		}

		const currentQuestion = questions[currentIndex];
		submitAnswer.mutate({
			questionId: currentQuestion.id,
			selectedAnswer,
			isCorrect: selectedAnswer === currentQuestion.correctAnswer,
		});
	};

	const handleSelect = (index: number) => {
		if (showAnswer || submitAnswer.isPending) {
			return;
		}
		setSelectedAnswer(index);
		
		if (AUTO_SUBMIT) {
			const currentQuestion = questions[currentIndex];
			const isCorrect = index === currentQuestion.correctAnswer;
			
			// ✅ 즉시 UI 업데이트 (Optimistic UI)
			if (isCorrect) {
				setCorrectCount((prev) => prev + 1);
				showToast.success("정답입니다! 🎉");
			} else {
				showToast.error("틀렸습니다 😢");
			}
			setShowAnswer(true);
			
			// ✅ 백그라운드 서버 전송 (BYPASS 시 스킵)
			if (!BYPASS_AUTH) {
				submitAnswer.mutate({
					questionId: currentQuestion.id,
					selectedAnswer: index,
					isCorrect,
				});
			}
		}
	};

	const handleNext = () => {
		if (currentIndex < questions.length - 1) {
			setCurrentIndex((prev) => prev + 1);
			setSelectedAnswer(null);
			setShowAnswer(false);
		} else {
			// 완료 - 세션 종료
			if (BYPASS_AUTH) {
				// BYPASS 모드: 로컬 완료 처리
				setShowScoreCard(true);
			} else if (sessionId !== null) {
				endSession.mutate({
					sessionId,
					questionsCompleted: currentIndex + 1,
					correctAnswers: correctCount,
				});
			} else {
				showToast.success(`${decodedCategory} 카테고리를 완료했습니다! 🎊`);
				router.back();
			}
		}
	};

	const handleRetry = () => {
		setCurrentIndex(0);
		setSelectedAnswer(null);
		setShowAnswer(false);
		setCorrectCount(0);
		setShowScoreCard(false);
		if (!BYPASS_AUTH && decodedCategory) {
			startSession.mutate({ 
				mode: "category",
				categoryFilter: decodedCategory 
			});
		} else {
			setSessionStartTime(new Date());
		}
	};

	const handlePrevious = () => {
		if (currentIndex > 0) {
			setCurrentIndex((prev) => prev - 1);
			setSelectedAnswer(null);
			setShowAnswer(false);
		}
	};

	// 카테고리 없음 처리
	if (!decodedCategory) {
		return (
			<Container>
				<View className="flex-1 justify-center items-center p-6">
					<Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
					<Text className="text-2xl font-bold text-foreground mb-2 mt-4">
						카테고리를 찾을 수 없습니다
					</Text>
					<TouchableOpacity
						onPress={() => router.back()}
						className="mt-6 px-6 py-3 bg-primary rounded-lg"
					>
						<Text className="text-primary-foreground font-medium">돌아가기</Text>
					</TouchableOpacity>
				</View>
			</Container>
		);
	}

	// ScoreCard 표시
	if (showScoreCard) {
		return (
			<ScoreCard
				totalQuestions={currentIndex + 1}
				correctAnswers={correctCount}
				mode="category"
				duration={elapsedSeconds}
				onRetry={handleRetry}
			/>
		);
	}

	if (isLoading) {
		return (
			<Container>
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color="#6366F1" />
					<Text className="mt-4 text-muted-foreground">문제를 불러오는 중...</Text>
				</View>
			</Container>
		);
	}

	if (!questions || questions.length === 0) {
		return (
			<Container>
				<View className="flex-1 justify-center items-center p-6">
					<Ionicons name="folder-open-outline" size={48} color="#9CA3AF" />
					<Text className="text-2xl font-bold text-foreground mb-2 mt-4">
						문제가 없습니다
					</Text>
					<Text className="text-muted-foreground mb-4 text-center">
						{decodedCategory} 카테고리에 문제가 없습니다
					</Text>
					<TouchableOpacity
						onPress={() => router.back()}
						className="px-6 py-3 bg-primary rounded-lg"
					>
						<Text className="text-primary-foreground font-medium">돌아가기</Text>
					</TouchableOpacity>
				</View>
			</Container>
		);
	}

	const currentQuestion = questions[currentIndex];
	const isLastQuestion = currentIndex === questions.length - 1;

	return (
		<Container>
			<ScrollView className="flex-1">
				<View className="p-4">
					{/* 헤더 */}
					<View className="mb-6">
						{/* 카테고리명 표시 */}
						<View className="flex-row items-center gap-2 mb-4">
							<Ionicons name="folder-open" size={16} color="#6366F1" />
							<Text className="text-sm text-muted-foreground">{decodedCategory}</Text>
						</View>
						
						<View className="flex-row items-center justify-between mb-4">
							<View className="flex-row items-center gap-4">
								{sessionStartTime && (
									<SessionTimer
										startTime={sessionStartTime}
										onTimeUpdate={setElapsedSeconds}
									/>
								)}
								<View className="flex-row items-center gap-2">
									<Ionicons name="checkmark-circle" size={16} color="#22C55E" />
									<Text className="text-sm text-muted-foreground">
										{correctCount} / {currentIndex + 1}
									</Text>
								</View>
							</View>
						</View>

						<ProgressBar
							current={currentIndex + 1}
							total={questions.length}
							correct={correctCount}
						/>
					</View>

					{/* 문제 카드 */}
					<View className="mb-6">
						<QuestionCard
							question={currentQuestion}
							selectedAnswer={selectedAnswer}
							onAnswerSelect={handleSelect}
							showAnswer={showAnswer}
							questionNumber={currentIndex + 1}
							totalQuestions={questions.length}
						/>
					</View>

					{/* 액션 버튼 */}
					{showAnswer ? (
						// 답 표시 후: 다음 문제 버튼만 표시
						<NextButton 
							onNext={handleNext}
							isLastQuestion={isLastQuestion}
						/>
					) : (
						// 답 선택 전: 이전/다음 버튼 표시
						<View className="flex-row items-center justify-between gap-3">
							<TouchableOpacity
								onPress={handlePrevious}
								disabled={currentIndex === 0}
								className={`flex-1 p-4 rounded-lg border border-border ${
									currentIndex === 0 ? "opacity-50" : "bg-card"
								}`}
							>
								<Text
									className={`text-center font-medium ${
										currentIndex === 0 ? "text-muted-foreground" : "text-foreground"
									}`}
								>
									이전 문제
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={handleNext}
								className="flex-1 p-4 bg-primary rounded-lg"
							>
								<Text className="text-primary-foreground text-center font-semibold">
									{isLastQuestion ? "완료" : "다음 문제"}
								</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</ScrollView>
		</Container>
	);
}
