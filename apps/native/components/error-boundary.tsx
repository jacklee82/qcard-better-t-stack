import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ErrorBoundaryProps {
	children: React.ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			return (
				<View className="flex-1 justify-center items-center bg-background px-6">
					<View className="w-20 h-20 bg-destructive/10 rounded-full items-center justify-center mb-4">
						<Ionicons name="alert-circle" size={40} color="hsl(0 84.2% 60.2%)" />
					</View>
					<Text className="text-foreground font-bold text-xl mb-2 text-center">
						문제가 발생했습니다
					</Text>
					<Text className="text-muted-foreground text-center mb-6">
						{this.state.error?.message || "알 수 없는 오류가 발생했습니다"}
					</Text>
					<TouchableOpacity
						onPress={this.handleReset}
						className="px-6 py-3 bg-primary rounded-lg"
					>
						<Text className="text-primary-foreground font-semibold">
							다시 시도
						</Text>
					</TouchableOpacity>
				</View>
			);
		}

		return this.props.children;
	}
}

