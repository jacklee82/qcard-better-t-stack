/**
 * GoalCard Native Component
 * Web 버전에서 이식
 */

import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { trpc } from "@/utils/trpc";
import { Ionicons } from "@expo/vector-icons";

export function GoalCard() {
	const [isEditing, setIsEditing] = useState(false);
	const [targetAccuracy, setTargetAccuracy] = useState("80");
	const [dailyTarget, setDailyTarget] = useState("10");

	const { data: goal, isLoading, isError, error } = trpc.goal.get.useQuery();
	const { data: progress, isError: isProgressError } = trpc.goal.getProgress.useQuery();
	const { data: totalCount = 0 } = trpc.question.getCount.useQuery();
	const utils = trpc.useUtils();

	const setGoal = trpc.goal.set.useMutation({
		onSuccess: () => {
			utils.goal.get.invalidate();
			utils.goal.getProgress.invalidate();
			Alert.alert("성공", "목표가 설정되었습니다 🎯");
			setIsEditing(false);
		},
		onError: (error) => {
			Alert.alert("오류", "목표 설정 실패: " + error.message);
		},
	});

	const deleteGoal = trpc.goal.delete.useMutation({
		onSuccess: () => {
			utils.goal.get.invalidate();
			utils.goal.getProgress.invalidate();
			Alert.alert("성공", "목표가 삭제되었습니다");
			setIsEditing(false);
		},
		onError: (error) => {
			Alert.alert("오류", "목표 삭제 실패: " + error.message);
		},
	});

	const handleSave = () => {
		const accuracy = parseFloat(targetAccuracy);
		const daily = parseInt(dailyTarget);

		if (isNaN(accuracy) || accuracy < 0 || accuracy > 100) {
			Alert.alert("오류", "정답률은 0~100 사이로 입력해주세요");
			return;
		}
		if (isNaN(daily) || daily < 1 || daily > totalCount) {
			Alert.alert("오류", `일일 문제 수는 1~${totalCount} 사이로 입력해주세요`);
			return;
		}

		setGoal.mutate({
			targetAccuracy: accuracy / 100,
			dailyQuestionTarget: daily,
		});
	};

	const handleEdit = () => {
		if (goal) {
			setTargetAccuracy(((goal.targetAccuracy || 0.8) * 100).toString());
			setDailyTarget((goal.dailyQuestionTarget || 10).toString());
		}
		setIsEditing(true);
	};

	const handleDelete = () => {
		Alert.alert("목표 삭제", "목표를 삭제하시겠습니까?", [
			{ text: "취소", style: "cancel" },
			{
				text: "삭제",
				style: "destructive",
				onPress: () => deleteGoal.mutate(),
			},
		]);
	};

	if (isLoading) {
		return (
			<View className="p-4 bg-card rounded-xl border border-border">
				<View className="flex-row items-center mb-2">
					<Ionicons name="flag" size={20} color="hsl(221.2 83.2% 53.3%)" />
					<Text className="ml-2 text-foreground font-semibold">학습 목표</Text>
				</View>
				<ActivityIndicator size="small" color="hsl(221.2 83.2% 53.3%)" />
			</View>
		);
	}

	// FIX-0022: 에러 처리 추가
	if (isError || isProgressError) {
		console.error("GoalCard API error:", error);
		return (
			<View className="p-4 bg-card rounded-xl border border-border">
				<View className="flex-row items-center mb-2">
					<Ionicons name="flag" size={20} color="hsl(221.2 83.2% 53.3%)" />
					<Text className="ml-2 text-foreground font-semibold">학습 목표</Text>
				</View>
				<Text className="text-sm text-muted-foreground">
					목표 데이터를 불러올 수 없습니다
				</Text>
			</View>
		);
	}

	// 편집 모드
	if (isEditing) {
		return (
			<View className="p-4 bg-card rounded-xl border border-border">
				<View className="flex-row items-center justify-between mb-4">
					<View className="flex-row items-center">
						<Ionicons name="flag" size={20} color="hsl(221.2 83.2% 53.3%)" />
						<Text className="ml-2 text-foreground font-semibold">
							학습 목표 설정
						</Text>
					</View>
					<TouchableOpacity onPress={() => setIsEditing(false)}>
						<Ionicons name="close" size={24} color="hsl(240 3.8% 46.1%)" />
					</TouchableOpacity>
				</View>

				<View className="mb-4">
					<Text className="text-sm text-foreground mb-2">목표 정답률 (%)</Text>
					<TextInput
						className="p-3 rounded-lg bg-muted text-foreground border border-border"
						value={targetAccuracy}
						onChangeText={setTargetAccuracy}
						keyboardType="numeric"
						placeholder="80"
						placeholderTextColor="#9CA3AF"
					/>
					<Text className="text-xs text-muted-foreground mt-1">
						달성하고 싶은 정답률을 입력하세요 (0-100)
					</Text>
				</View>

				<View className="mb-4">
					<Text className="text-sm text-foreground mb-2">일일 목표 문제 수</Text>
					<TextInput
						className="p-3 rounded-lg bg-muted text-foreground border border-border"
						value={dailyTarget}
						onChangeText={setDailyTarget}
						keyboardType="numeric"
						placeholder="10"
						placeholderTextColor="#9CA3AF"
					/>
					<Text className="text-xs text-muted-foreground mt-1">
						하루에 풀고 싶은 문제 수를 입력하세요 (1-{totalCount})
					</Text>
				</View>

				<TouchableOpacity
					onPress={handleSave}
					disabled={setGoal.isPending}
					className={`p-3 rounded-lg ${
						setGoal.isPending ? "bg-primary/50" : "bg-primary"
					}`}
				>
					{setGoal.isPending ? (
						<ActivityIndicator size="small" color="#fff" />
					) : (
						<Text className="text-primary-foreground font-semibold text-center">
							저장
						</Text>
					)}
				</TouchableOpacity>

				{goal && (
					<TouchableOpacity
						onPress={handleDelete}
						disabled={deleteGoal.isPending}
						className="mt-2 p-3 rounded-lg border border-destructive"
					>
						<Text className="text-destructive font-medium text-center">
							목표 삭제
						</Text>
					</TouchableOpacity>
				)}
			</View>
		);
	}

	// 목표가 없는 경우
	if (!goal || !progress?.hasGoal) {
		return (
			<View className="p-4 bg-card rounded-xl border border-border">
				<View className="flex-row items-center mb-2">
					<Ionicons name="flag" size={20} color="hsl(221.2 83.2% 53.3%)" />
					<Text className="ml-2 text-foreground font-semibold">학습 목표</Text>
				</View>
				<Text className="text-sm text-muted-foreground mb-4">
					아직 학습 목표가 설정되지 않았습니다.
				</Text>
				<TouchableOpacity
					onPress={handleEdit}
					className="p-3 bg-primary rounded-lg"
				>
					<Text className="text-primary-foreground font-semibold text-center">
						목표 설정하기
					</Text>
				</TouchableOpacity>
			</View>
		);
	}

	// 목표가 있는 경우 - 진행률 표시
	const currentAccuracyPercent = (progress.currentAccuracy || 0) * 100;
	const targetAccuracyPercent = (progress.targetAccuracy || 0) * 100;
	const accuracyProgress = Math.min(progress.accuracyProgress || 0, 100);
	const dailyProgress = Math.min(progress.dailyProgress || 0, 100);

	return (
		<View className="p-4 bg-card rounded-xl border border-border">
			<View className="flex-row items-center justify-between mb-4">
				<View className="flex-row items-center">
					<Ionicons name="flag" size={20} color="hsl(221.2 83.2% 53.3%)" />
					<Text className="ml-2 text-foreground font-semibold">학습 목표</Text>
				</View>
				<TouchableOpacity onPress={handleEdit}>
					<Ionicons name="create-outline" size={20} color="hsl(240 3.8% 46.1%)" />
				</TouchableOpacity>
			</View>

			{/* 정답률 목표 */}
			{progress.targetAccuracy !== null && (
				<View className="mb-4">
					<View className="flex-row items-center justify-between mb-2">
						<View className="flex-row items-center">
							<Ionicons name="trending-up" size={16} color="hsl(221.2 83.2% 53.3%)" />
							<Text className="ml-2 text-sm font-medium text-foreground">
								정답률
							</Text>
						</View>
						<Text className="text-sm text-muted-foreground">
							{currentAccuracyPercent.toFixed(1)}% / {targetAccuracyPercent.toFixed(0)}%
						</Text>
					</View>
					<View className="h-2 bg-muted rounded-full overflow-hidden">
						<View
							className="h-full bg-blue-500"
							style={{ width: `${accuracyProgress}%` }}
						/>
					</View>
					{accuracyProgress >= 100 && (
						<View className="flex-row items-center mt-1">
							<Ionicons name="checkmark-circle" size={12} color="hsl(142.1 76.2% 36.3%)" />
							<Text className="ml-1 text-xs text-green-500">목표 달성! 🎉</Text>
						</View>
					)}
				</View>
			)}

			{/* 일일 문제 목표 */}
			{progress.dailyQuestionTarget !== null && (
				<View>
					<View className="flex-row items-center justify-between mb-2">
						<View className="flex-row items-center">
							<Ionicons name="calendar" size={16} color="hsl(262.1 83.3% 57.8%)" />
							<Text className="ml-2 text-sm font-medium text-foreground">
								오늘의 학습
							</Text>
						</View>
						<Text className="text-sm text-muted-foreground">
							{progress.dailyQuestionsCompleted || 0} / {progress.dailyQuestionTarget}
						</Text>
					</View>
					<View className="h-2 bg-muted rounded-full overflow-hidden">
						<View
							className="h-full bg-purple-500"
							style={{ width: `${dailyProgress}%` }}
						/>
					</View>
					{dailyProgress >= 100 && (
						<View className="flex-row items-center mt-1">
							<Ionicons name="checkmark-circle" size={12} color="hsl(142.1 76.2% 36.3%)" />
							<Text className="ml-1 text-xs text-green-500">오늘 목표 달성! 🎉</Text>
						</View>
					)}
				</View>
			)}
		</View>
	);
}

