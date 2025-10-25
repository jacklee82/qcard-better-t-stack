/**
 * NextButton Component
 * 다음 문제 또는 완료하기 버튼
 */

import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface NextButtonProps {
	onNext: () => void;
	isLastQuestion: boolean;
	disabled?: boolean;
	isLoading?: boolean;
}

export function NextButton({ 
	onNext, 
	isLastQuestion, 
	disabled = false, 
	isLoading = false 
}: NextButtonProps) {
	const buttonText = isLastQuestion ? "완료하기" : "다음 문제";
	const iconName = isLastQuestion ? "checkmark-circle" : "arrow-forward";
	
	return (
		<TouchableOpacity
			onPress={onNext}
			disabled={disabled || isLoading}
			className={`w-full p-4 rounded-lg flex-row items-center justify-center gap-2 ${
				disabled || isLoading
					? "bg-muted opacity-50"
					: "bg-primary active:bg-primary/90"
			}`}
			android_ripple={{ 
				color: "rgba(255, 255, 255, 0.1)",
				borderless: false 
			}}
			style={({ pressed }) => [
				{
					opacity: pressed && !disabled && !isLoading ? 0.9 : 1,
					transform: [{ scale: pressed && !disabled && !isLoading ? 0.98 : 1 }],
				},
			]}
		>
			{isLoading ? (
				<ActivityIndicator size="small" color="white" />
			) : (
				<Ionicons 
					name={iconName} 
					size={20} 
					color={disabled ? "#9CA3AF" : "white"} 
				/>
			)}
			<Text className={`text-center font-semibold text-base ${
				disabled || isLoading
					? "text-muted-foreground"
					: "text-primary-foreground"
			}`}>
				{isLoading ? "처리 중..." : buttonText}
			</Text>
		</TouchableOpacity>
	);
}

