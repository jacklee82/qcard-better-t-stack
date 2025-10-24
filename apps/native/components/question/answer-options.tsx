/**
 * AnswerOptions Native Component
 * Pressable 기반 선택지 UI
 */

import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AnswerOptionsProps {
	options: string[];
	selectedAnswer: number | null;
	correctAnswer?: number;
	onSelect: (index: number) => void;
	disabled?: boolean;
}

export function AnswerOptions({
	options,
	selectedAnswer,
	correctAnswer,
	onSelect,
	disabled = false,
}: AnswerOptionsProps) {
	return (
		<View className="gap-3">
			{options.map((option, index) => {
				const isSelected = selectedAnswer === index;
				const isCorrect = correctAnswer === index;
				const showCorrect = disabled && isCorrect;
				const showWrong = disabled && isSelected && !isCorrect;

				// 스타일 결정
				let borderColor = "border-border";
				let bgColor = "bg-card";
				let textColor = "text-foreground";

				if (showCorrect) {
					borderColor = "border-green-500";
					bgColor = "bg-green-500/10";
					textColor = "text-green-700 dark:text-green-400";
				} else if (showWrong) {
					borderColor = "border-red-500";
					bgColor = "bg-red-500/10";
					textColor = "text-red-700 dark:text-red-400";
				} else if (isSelected && !disabled) {
					borderColor = "border-primary";
					bgColor = "bg-primary/5";
				}

				return (
					<Pressable
						key={index}
						onPress={() => !disabled && onSelect(index)}
						disabled={disabled}
						className={`p-4 rounded-lg border-2 ${borderColor} ${bgColor}`}
						android_ripple={{ color: "rgba(99, 102, 241, 0.1)" }}
						style={({ pressed }) => [
							{
								opacity: pressed && !disabled ? 0.7 : 1,
							},
						]}
					>
						<View className="flex-row items-center justify-between">
							<Text className={`flex-1 ${textColor} text-base`}>
								{index + 1}. {option}
							</Text>
							{showCorrect && (
								<Ionicons name="checkmark-circle" size={20} color="#22C55E" />
							)}
							{showWrong && (
								<Ionicons name="close-circle" size={20} color="#EF4444" />
							)}
						</View>
					</Pressable>
				);
			})}
		</View>
	);
}

