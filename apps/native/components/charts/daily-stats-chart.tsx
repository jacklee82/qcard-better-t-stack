/**
 * DailyStatsChart Native Component
 * 
 * FIX-0012: 차트 라이브러리 플랫폼 분기
 * - Web: Recharts LineChart 사용
 * - Native: react-native-chart-kit LineChart 사용
 */

import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useColorScheme } from "@/lib/use-color-scheme";

interface DailyStat {
	date: string;
	total: number;
	correct: number;
	accuracy: number;
}

interface DailyStatsChartProps {
	data: DailyStat[];
	days?: number;
}

export function DailyStatsChart({ data, days = 7 }: DailyStatsChartProps) {
	const { isDarkColorScheme } = useColorScheme();
	const screenWidth = Dimensions.get("window").width;

	// FIX-0008: 배열 기본값 가드
	if (!data || data.length === 0) {
		return (
			<View className="p-4 bg-card rounded-xl border border-border">
				<View className="p-4 border-b border-border">
					<Text className="text-foreground font-semibold text-base">
						최근 {days}일 학습 현황
					</Text>
				</View>
				<View className="p-8">
					<Text className="text-muted-foreground text-center">
						아직 학습 기록이 없습니다
					</Text>
					<Text className="text-muted-foreground text-xs text-center mt-2">
						학습을 시작하면 여기에 통계가 표시됩니다
					</Text>
				</View>
			</View>
		);
	}

	// 날짜 포맷팅 (MM/DD)
	const labels = data.map((stat) => {
		const date = new Date(stat.date);
		return `${date.getMonth() + 1}/${date.getDate()}`;
	});

	// 학습한 문제 수 데이터
	const studiedData = data.map((stat) => stat.total);
	
	// 정답률 데이터
	const accuracyData = data.map((stat) => stat.accuracy);

	const chartConfig = {
		backgroundColor: isDarkColorScheme ? "#0f172a" : "#ffffff",
		backgroundGradientFrom: isDarkColorScheme ? "#1e293b" : "#f8fafc",
		backgroundGradientTo: isDarkColorScheme ? "#0f172a" : "#ffffff",
		decimalPlaces: 0,
		color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // blue-500
		labelColor: (opacity = 1) =>
			isDarkColorScheme
				? `rgba(148, 163, 184, ${opacity})` // slate-400
				: `rgba(71, 85, 105, ${opacity})`, // slate-600
		style: {
			borderRadius: 16,
		},
		propsForLabels: {
			fontSize: 10,
		},
		propsForDots: {
			r: "4",
			strokeWidth: "2",
		},
	};

	// 통계 요약
	const totalStudied = data.reduce((sum, stat) => sum + stat.total, 0);
	const totalCorrect = data.reduce((sum, stat) => sum + stat.correct, 0);
	const avgAccuracy = data.reduce((sum, stat) => sum + stat.accuracy, 0) / data.length;

	return (
		<View className="bg-card rounded-xl border border-border overflow-hidden">
			<View className="p-4 border-b border-border">
				<Text className="text-foreground font-semibold text-base">
					최근 {days}일 학습 현황
				</Text>
				<Text className="text-muted-foreground text-xs mt-1">
					일별 학습 문제 수와 정답률
				</Text>
			</View>
			
			{/* 학습한 문제 수 차트 */}
			<View className="p-4 border-b border-border">
				<Text className="text-muted-foreground text-xs mb-2">학습한 문제</Text>
				<LineChart
					data={{
						labels,
						datasets: [
							{
								data: studiedData,
								color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // blue-500
								strokeWidth: 2,
							},
						],
					}}
					width={screenWidth - 64}
					height={180}
					chartConfig={chartConfig}
					bezier
					style={{
						borderRadius: 12,
					}}
					withInnerLines
					withOuterLines
					withVerticalLines={false}
					withHorizontalLines
					withDots
					withShadow={false}
				/>
			</View>

			{/* 정답률 차트 */}
			<View className="p-4 border-b border-border">
				<Text className="text-muted-foreground text-xs mb-2">정답률 (%)</Text>
				<LineChart
					data={{
						labels,
						datasets: [
							{
								data: accuracyData,
								color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // green-500
								strokeWidth: 2,
							},
						],
					}}
					width={screenWidth - 64}
					height={180}
					chartConfig={{
						...chartConfig,
						color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
					}}
					bezier
					style={{
						borderRadius: 12,
					}}
					withInnerLines
					withOuterLines
					withVerticalLines={false}
					withHorizontalLines
					withDots
					withShadow={false}
					yAxisSuffix="%"
					fromZero
				/>
			</View>

			{/* 요약 정보 */}
			<View className="p-4">
				<View className="flex-row justify-between">
					<View className="flex-1 items-center">
						<Text className="text-2xl font-bold text-blue-500">
							{totalStudied}
						</Text>
						<Text className="text-xs text-muted-foreground mt-1">
							총 학습 문제
						</Text>
					</View>
					<View className="flex-1 items-center">
						<Text className="text-2xl font-bold text-green-500">
							{totalCorrect}
						</Text>
						<Text className="text-xs text-muted-foreground mt-1">
							총 정답
						</Text>
					</View>
					<View className="flex-1 items-center">
						<Text className="text-2xl font-bold text-purple-500">
							{avgAccuracy.toFixed(1)}%
						</Text>
						<Text className="text-xs text-muted-foreground mt-1">
							평균 정답률
						</Text>
					</View>
				</View>
			</View>
		</View>
	);
}

