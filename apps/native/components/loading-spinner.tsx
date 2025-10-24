import { View, ActivityIndicator, Text } from "react-native";

interface LoadingSpinnerProps {
	message?: string;
	size?: "small" | "large";
}

export function LoadingSpinner({ message, size = "large" }: LoadingSpinnerProps) {
	return (
		<View className="flex-1 justify-center items-center bg-background">
			<ActivityIndicator size={size} color="hsl(221.2 83.2% 53.3%)" />
			{message && (
				<Text className="text-muted-foreground mt-4 text-center px-6">
					{message}
				</Text>
			)}
		</View>
	);
}

