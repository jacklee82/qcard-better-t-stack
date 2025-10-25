/**
 * CodeToggle Native Component
 * 코드 블록 보기/숨기기 토글 버튼
 */

import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CodeToggleProps {
	isVisible: boolean;
	onToggle: () => void;
	disabled?: boolean;
}

export function CodeToggle({ isVisible, onToggle, disabled = false }: CodeToggleProps) {
	return (
		<TouchableOpacity
			onPress={onToggle}
			disabled={disabled}
			className={`flex-row items-center justify-center p-3 rounded-lg border border-border mb-3 ${
				disabled 
					? "bg-muted/20 opacity-50" 
					: isVisible 
						? "bg-amber-500/10 border-amber-500/20" 
						: "bg-blue-500/10 border-blue-500/20"
			}`}
			android_ripple={{ 
				color: isVisible ? "rgba(245, 158, 11, 0.1)" : "rgba(59, 130, 246, 0.1)",
				borderless: false 
			}}
			style={({ pressed }) => [
				{
					opacity: pressed && !disabled ? 0.7 : 1,
					transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
				},
			]}
		>
			<Ionicons 
				name={isVisible ? "eye" : "eye-off"} 
				size={16} 
				color={disabled ? "#9CA3AF" : isVisible ? "#F59E0B" : "#3B82F6"} 
			/>
			<Text className={`ml-2 text-sm font-medium ${
				disabled 
					? "text-muted-foreground" 
					: isVisible 
						? "text-amber-600 dark:text-amber-400" 
						: "text-blue-600 dark:text-blue-400"
			}`}>
				{isVisible ? "코드 숨기기" : "코드 보기"}
			</Text>
		</TouchableOpacity>
	);
}
