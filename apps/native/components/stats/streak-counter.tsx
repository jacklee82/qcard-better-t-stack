/**
 * StreakCounter Native Component
 * 연속 학습일 표시
 */

import { View, Text, ActivityIndicator } from "react-native";
import { trpc } from "@/utils/trpc";
import { Ionicons } from "@expo/vector-icons";

interface StatsData {
	streak?: number;
}

interface StreakCounterProps {
	stats?: StatsData;  // FIX-0023: props로 stats 받기
}

export function StreakCounter({ stats: passedStats }: StreakCounterProps) {
	const { data: stats, isLoading } = trpc.stats.getOverview.useQuery({
		enabled: !passedStats,  // FIX-0023: props로 받으면 호출 안 함
	});

	if (isLoading) {
		return (
			<View className="flex-1 p-4 bg-card rounded-lg border border-border">
				<View className="flex-row items-center mb-2">
					<Ionicons name="flame" size={20} color="hsl(24.6 95% 53.1%)" />
					<Text className="ml-2 text-sm text-muted-foreground">연속 학습</Text>
				</View>
				<ActivityIndicator size="small" color="hsl(24.6 95% 53.1%)" />
			</View>
		);
	}

	// FIX-0023: props가 있으면 그것 사용, 없으면 쿼리 결과 사용
	const finalStats = passedStats || stats;
	const streak = finalStats?.streak || 0;
	const streakMessage =
		streak === 0
			? "오늘 학습을 시작하세요!"
			: streak === 1
			? "좋은 시작입니다!"
			: streak < 7
			? "계속 이어가세요!"
			: streak < 30
			? "훌륭합니다! 🔥"
			: "대단합니다! 🏆";

	return (
		<View className="flex-1 p-4 bg-card rounded-lg border border-border">
			<View className="flex-row items-center mb-2">
				<Ionicons name="flame" size={20} color="hsl(24.6 95% 53.1%)" />
				<Text className="ml-2 text-sm text-muted-foreground">연속 학습</Text>
			</View>
			<View className="flex-row items-baseline">
				<Text className="text-3xl font-bold text-foreground">{streak}</Text>
				<Text className="ml-1 text-lg text-muted-foreground">일</Text>
			</View>
			<Text className="text-xs text-muted-foreground mt-1">{streakMessage}</Text>
		</View>
	);
}

