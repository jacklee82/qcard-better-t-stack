/**
 * Review Study Screen (Native)
 * 오답 복습 화면
 */

import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/utils/trpc";
import { QuestionCard } from "@/components/question/question-card";
import { ProgressBar } from "@/components/study/progress-bar";
import { SessionTimer } from "@/components/study/session-timer";
import { ScoreCard } from "@/components/study/score-card";
import { NextButton } from "@/components/study/next-button";
import { showToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { Container } from "@/components/container";

export default function ReviewStudyScreen() {
	const router = useRouter();
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

	// FIX-0008: 오답 문제 ID 가져오기 (기본값 가드)
	const { data: incorrectProgress = [], isLoading: progressLoading } =
		trpc.progress.getIncorrect.useQuery();

	const questionIds = incorrectProgress.map((p) => p.questionId);

	// FIX-0008: 오답 문제 가져오기 (기본값 가드)
	const { data: questions = [], isLoading: questionsLoading } =
		trpc.question.getByIds.useQuery(
			{ ids: questionIds },
			{ enabled: questionIds.length > 0 }
		);

	const isLoading = progressLoading || questionsLoading;

	// 세션 시작
	const startSession = trpc.session.start.useMutation({
		onSuccess: (data) => {
			setSessionId(data.sessionId);
			// FIX-0010: Date 직렬화 처리
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
		if (questions.length > 0) {
			if (!BYPASS_AUTH) {
				startSession.mutate({ mode: "review" });
			} else {
				setSessionStartTime(new Date());
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [questions.length]);

	// 답안 제출
	const submitAnswer = trpc.progress.submit.useMutation({
		onSuccess: () => {
			if (selectedAnswer === questions?.[currentIndex].correctAnswer) {
				setCorrectCount((prev) => prev + 1);
				showToast.success("정답입니다! 🎉");
			} else {
				showToast.error("틀렸습니다 😢");
			}
			setShowAnswer(true);
			// 자동 진행 제거 - 사용자가 "다음 문제" 버튼을 눌러야 함
		},
		onError: (error) => {
			showToast.error("제출 중 오류가 발생했습니다: " + error.message);
			// 오류 시에도 결과 표시만 하고 자동 진행 제거
			setShowAnswer(true);
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
			
			if (BYPASS_AUTH) {
				// 로컬 채점 모드
				if (isCorrect) {
					setCorrectCount((prev) => prev + 1);
					showToast.success("정답입니다! 🎉");
				} else {
					showToast.error("틀렸습니다 😢");
				}
				setShowAnswer(true);
				// 자동 진행 제거 - 사용자가 "다음 문제" 버튼을 눌러야 함
			} else {
				// 서버 제출 모드
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
				setShowScoreCard(true);
			} else if (sessionId !== null) {
				endSession.mutate({
					sessionId,
					questionsCompleted: currentIndex + 1,
					correctAnswers: correctCount,
				});
			} else {
				showToast.success("모든 문제를 완료했습니다! 🎊");
				router.push("/dashboard");
			}
		}
	};

	const handleRetry = () => {
		setCurrentIndex(0);
		setSelectedAnswer(null);
		setShowAnswer(false);
		setCorrectCount(0);
		setShowScoreCard(false);
		if (!BYPASS_AUTH) {
			startSession.mutate({ mode: "review" });
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

	// ScoreCard 표시
	if (showScoreCard) {
		return (
			<ScoreCard
				totalQuestions={currentIndex + 1}
				correctAnswers={correctCount}
				mode="review"
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
					<Ionicons name="refresh-outline" size={48} color="#9CA3AF" />
					<Text className="text-2xl font-bold text-foreground mb-2 mt-4">
						복습할 문제가 없습니다
					</Text>
					<Text className="text-muted-foreground mb-6 text-center">
						틀린 문제가 없거나 모두 복습했습니다
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
						// 답 선택 전: 이전/제출 버튼 표시
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
								onPress={handleSubmit}
								disabled={selectedAnswer === null || submitAnswer.isPending}
								className={`flex-1 p-4 rounded-lg ${
									selectedAnswer === null || submitAnswer.isPending
										? "bg-primary/50"
										: "bg-primary"
								}`}
							>
								<Text className="text-primary-foreground text-center font-semibold">
									{submitAnswer.isPending ? "제출 중..." : "제출하기"}
								</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</ScrollView>
		</Container>
	);
}

