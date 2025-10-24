/**
 * CategoryChart Native Component
 * 
 * FIX-0012: 차트 라이브러리 플랫폼 분기
 * - Web: Recharts 사용
 * - Native: react-native-chart-kit 사용
 * - 동일한 props 인터페이스 유지
 */

import { View, Text, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { useColorScheme } from "@/lib/use-color-scheme";

interface CategoryStat {
	category: string;
	total: number;
	correct: number;
	accuracy: number;
}

interface CategoryChartProps {
	data: CategoryStat[];
}

export function CategoryChart({ data }: CategoryChartProps) {
	const { isDarkColorScheme } = useColorScheme();
	const screenWidth = Dimensions.get("window").width;

	// FIX-0008: 배열 기본값 가드
	if (!data || data.length === 0) {
		return (
			<View className="p-4 bg-card rounded-xl border border-border">
				<Text className="text-muted-foreground text-center">
					아직 학습 데이터가 없습니다
				</Text>
			</View>
		);
	}

	// 데이터 변환 (상위 6개만 표시)
	const topCategories = data.slice(0, 6);
	const labels = topCategories.map((stat) => {
		// 카테고리명이 길면 축약
		const name = stat.category;
		return name.length > 10 ? name.substring(0, 8) + "..." : name;
	});
	const accuracyData = topCategories.map((stat) => stat.accuracy);

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
		propsForBackgroundLines: {
			strokeDasharray: "", // solid lines
			stroke: isDarkColorScheme ? "#334155" : "#e2e8f0",
			strokeWidth: 1,
		},
	};

	return (
		<View className="bg-card rounded-xl border border-border overflow-hidden">
			<View className="p-4 border-b border-border">
				<Text className="text-foreground font-semibold text-base">
					카테고리별 정답률
				</Text>
				<Text className="text-muted-foreground text-xs mt-1">
					상위 6개 카테고리
				</Text>
			</View>
			<View className="p-4">
				<BarChart
					data={{
						labels,
						datasets: [
							{
								data: accuracyData,
							},
						],
					}}
					width={screenWidth - 64} // 패딩 고려
					height={220}
					yAxisLabel=""
					yAxisSuffix="%"
					chartConfig={chartConfig}
					verticalLabelRotation={0}
					fromZero
					showValuesOnTopOfBars
					withInnerLines
					style={{
						borderRadius: 16,
					}}
				/>
			</View>
		</View>
	);
}

