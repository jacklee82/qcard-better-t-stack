/**
 * Sequential Study Screen (Native)
 * 순차 학습 화면
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
import { diagnoseJSONParseError, getJSONParseErrorDisplayInfo, logJSONParseError } from "@/utils/json-error-handler";

export default function SequentialStudyScreen() {
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

	// FIX-0008: 모든 문제 가져오기 (기본값 가드)
	const { data: questions = [], isLoading, error } = trpc.question.getAll.useQuery();
	
	// 데이터베이스 상태 확인
	const { data: dbHealth } = trpc.question.checkHealth.useQuery();
	
	// 데이터 무결성 검증
	const { data: dataIntegrity } = trpc.question.checkIntegrity.useQuery();
	
	// API 서버 상태 확인
	const { data: apiHealth } = trpc.health.status.useQuery();
	
	// 인증 상태 확인
	const { data: authHealth } = trpc.health.authentication.useQuery();

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
		if (!BYPASS_AUTH) {
			startSession.mutate({ mode: "sequential" });
		} else {
			// BYPASS 모드: 로컬 타이머만 시작
			setSessionStartTime(new Date());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 답안 제출 (Optimistic UI: UI 즉시 업데이트)
	const submitAnswer = trpc.progress.submit.useMutation({
		onSuccess: () => {
			// ✅ UI는 이미 handleSelect에서 즉시 업데이트됨
			// 백그라운드 진행률 저장만 확인
			console.log("진행률 저장 완료");
		},
		onError: (error) => {
			// ✅ UI는 이미 업데이트되었으므로 오류만 로깅
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
			startSession.mutate({ mode: "sequential" });
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
				mode="sequential"
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

	// 에러 처리
	if (error) {
		// JSON 파싱 오류 진단
		const jsonError = diagnoseJSONParseError(error);
		const errorInfo = getJSONParseErrorDisplayInfo(jsonError);
		
		// 오류 로깅
		logJSONParseError(jsonError, 'sequential-study');
		
		return (
			<Container>
				<View className="flex-1 justify-center items-center p-6">
					<Text className="text-2xl font-bold text-foreground mb-2">
						{errorInfo.title}
					</Text>
					<Text className="text-muted-foreground mb-4 text-center">
						{errorInfo.message}
					</Text>
					<Text className="text-sm text-muted-foreground mb-4 text-center">
						해결 방법: {errorInfo.solution}
					</Text>
					{dbHealth && (
						<View className="mb-4 p-4 bg-muted rounded-lg">
							<Text className="text-sm text-muted-foreground">
								상태: {dbHealth.status}
							</Text>
							<Text className="text-sm text-muted-foreground">
								연결: {dbHealth.isConnected ? '성공' : '실패'}
							</Text>
							<Text className="text-sm text-muted-foreground">
								문제 개수: {dbHealth.questionCount}개
							</Text>
						</View>
					)}
					{dataIntegrity && !dataIntegrity.isValid && (
						<View className="mb-4 p-4 bg-amber-100 dark:bg-amber-900/20 rounded-lg border border-amber-300 dark:border-amber-700">
							<Text className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
								⚠️ 데이터 무결성 문제
							</Text>
							<Text className="text-sm text-amber-700 dark:text-amber-300">
								유효한 문제: {dataIntegrity.validQuestions}개
							</Text>
							<Text className="text-sm text-amber-700 dark:text-amber-300">
								무효한 문제: {dataIntegrity.invalidQuestions}개
							</Text>
							<Text className="text-sm text-amber-700 dark:text-amber-300">
								발견된 문제: {dataIntegrity.issues.length}개
							</Text>
						</View>
					)}
					{apiHealth && apiHealth.status !== 'healthy' && (
						<View className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-700">
							<Text className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
								🚨 API 서버 문제
							</Text>
							<Text className="text-sm text-red-700 dark:text-red-300">
								상태: {apiHealth.status}
							</Text>
							<Text className="text-sm text-red-700 dark:text-red-300">
								응답시간: {apiHealth.responseTime}ms
							</Text>
							{apiHealth.error && (
								<Text className="text-sm text-red-700 dark:text-red-300">
									오류: {apiHealth.error}
								</Text>
							)}
						</View>
					)}
					{authHealth && authHealth.status !== 'healthy' && (
						<View className="mb-4 p-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg border border-orange-300 dark:border-orange-700">
							<Text className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
								🔐 인증 상태 문제
							</Text>
							<Text className="text-sm text-orange-700 dark:text-orange-300">
								상태: {authHealth.status}
							</Text>
							<Text className="text-sm text-orange-700 dark:text-orange-300">
								우회 모드: {authHealth.bypassMode ? '활성화' : '비활성화'}
							</Text>
							{authHealth.error && (
								<Text className="text-sm text-orange-700 dark:text-orange-300">
									오류: {authHealth.error}
								</Text>
							)}
						</View>
					)}
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

	if (!questions || questions.length === 0) {
		return (
			<Container>
				<View className="flex-1 justify-center items-center p-6">
					<Text className="text-2xl font-bold text-foreground mb-2">
						문제를 찾을 수 없습니다
					</Text>
					<Text className="text-muted-foreground mb-4 text-center">
						데이터베이스에 문제 데이터가 없습니다
					</Text>
					{dbHealth && (
						<View className="mb-4 p-4 bg-muted rounded-lg">
							<Text className="text-sm text-muted-foreground">
								상태: {dbHealth.status}
							</Text>
							<Text className="text-sm text-muted-foreground">
								연결: {dbHealth.isConnected ? '성공' : '실패'}
							</Text>
							<Text className="text-sm text-muted-foreground">
								문제 개수: {dbHealth.questionCount}개
							</Text>
						</View>
					)}
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

