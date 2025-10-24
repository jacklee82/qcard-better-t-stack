/**
 * ProgressBar Native Component
 * 학습 진행률 표시
 */

import { View, Text } from "react-native";

interface ProgressBarProps {
	current: number;
	total: number;
	correct?: number;
}

export function ProgressBar({ current, total, correct }: ProgressBarProps) {
	const percentage = total > 0 ? (current / total) * 100 : 0;
	const accuracy = current > 0 && correct !== undefined ? (correct / current) * 100 : 0;

	return (
		<View>
			{/* 진행률 텍스트 */}
			<View className="flex-row items-center justify-between mb-2">
				<Text className="text-sm text-muted-foreground">
					진행률: {current} / {total}
				</Text>
				{correct !== undefined && (
					<Text className="text-sm text-muted-foreground">
						정답률: {accuracy.toFixed(0)}%
					</Text>
				)}
			</View>

			{/* 진행률 바 */}
			<View className="h-2 bg-muted rounded-full overflow-hidden">
				<View
					className="h-full bg-primary"
					style={{ width: `${percentage}%` }}
				/>
			</View>

			{/* 정답률 바 (선택) */}
			{correct !== undefined && current > 0 && (
				<View className="h-1 bg-muted rounded-full overflow-hidden mt-1">
					<View
						className={`h-full ${
							accuracy >= 80
								? "bg-green-500"
								: accuracy >= 60
								? "bg-amber-500"
								: "bg-red-500"
						}`}
						style={{ width: `${accuracy}%` }}
					/>
				</View>
			)}
		</View>
	);
}

