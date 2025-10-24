import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";
import { useState } from "react";
import {
	ActivityIndicator,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SignupScreen() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSignup = async () => {
		// 유효성 검사
		if (!name || !email || !password || !confirmPassword) {
			setError("모든 필드를 입력해주세요");
			return;
		}

		if (password !== confirmPassword) {
			setError("비밀번호가 일치하지 않습니다");
			return;
		}

		if (password.length < 8) {
			setError("비밀번호는 최소 8자 이상이어야 합니다");
			return;
		}

		setIsLoading(true);
		setError(null);

		await authClient.signUp.email(
			{
				name,
				email,
				password,
			},
			{
				onError: (error) => {
					setError(error.error?.message || "회원가입에 실패했습니다");
					setIsLoading(false);
				},
				onSuccess: () => {
					setName("");
					setEmail("");
					setPassword("");
					setConfirmPassword("");
					queryClient.refetchQueries();
					// 회원가입 성공 시 대시보드로 이동
					router.replace("/(drawer)/(tabs)/dashboard");
				},
				onFinished: () => {
					setIsLoading(false);
				},
			},
		);
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<ScrollView
					contentContainerClassName="flex-1 justify-center px-6"
					keyboardShouldPersistTaps="handled"
				>
					{/* 로고/타이틀 */}
					<View className="items-center mb-8">
						<View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4">
							<Ionicons name="school" size={40} color="white" />
						</View>
						<Text className="text-3xl font-bold text-foreground mb-2">
							Qcard
						</Text>
						<Text className="text-muted-foreground text-center">
							Python/데이터 분석 학습 퀴즈 앱
						</Text>
					</View>

					{/* 회원가입 폼 */}
					<View className="mb-6">
						<Text className="text-2xl font-bold text-foreground mb-6">
							회원가입
						</Text>

						{error && (
							<View className="mb-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
								<Text className="text-destructive text-sm">{error}</Text>
							</View>
						)}

						<View className="mb-4">
							<Text className="text-sm font-medium text-foreground mb-2">
								이름
							</Text>
							<TextInput
								className="p-4 rounded-lg bg-card text-foreground border border-border"
								placeholder="홍길동"
								value={name}
								onChangeText={setName}
								placeholderTextColor="#9CA3AF"
								autoCapitalize="words"
							/>
						</View>

						<View className="mb-4">
							<Text className="text-sm font-medium text-foreground mb-2">
								이메일
							</Text>
							<TextInput
								className="p-4 rounded-lg bg-card text-foreground border border-border"
								placeholder="your@email.com"
								value={email}
								onChangeText={setEmail}
								placeholderTextColor="#9CA3AF"
								keyboardType="email-address"
								autoCapitalize="none"
								autoComplete="email"
							/>
						</View>

						<View className="mb-4">
							<Text className="text-sm font-medium text-foreground mb-2">
								비밀번호
							</Text>
							<TextInput
								className="p-4 rounded-lg bg-card text-foreground border border-border"
								placeholder="••••••••"
								value={password}
								onChangeText={setPassword}
								placeholderTextColor="#9CA3AF"
								secureTextEntry
								autoComplete="password-new"
							/>
							<Text className="text-xs text-muted-foreground mt-1">
								최소 8자 이상
							</Text>
						</View>

						<View className="mb-6">
							<Text className="text-sm font-medium text-foreground mb-2">
								비밀번호 확인
							</Text>
							<TextInput
								className="p-4 rounded-lg bg-card text-foreground border border-border"
								placeholder="••••••••"
								value={confirmPassword}
								onChangeText={setConfirmPassword}
								placeholderTextColor="#9CA3AF"
								secureTextEntry
								autoComplete="password-new"
							/>
						</View>

						<TouchableOpacity
							onPress={handleSignup}
							disabled={isLoading}
							className={`p-4 rounded-lg flex-row justify-center items-center ${
								isLoading ? "bg-primary/50" : "bg-primary"
							}`}
						>
							{isLoading ? (
								<ActivityIndicator size="small" color="#fff" />
							) : (
								<Text className="text-primary-foreground font-semibold text-base">
									회원가입
								</Text>
							)}
						</TouchableOpacity>
					</View>

					{/* 로그인 링크 */}
					<View className="flex-row justify-center items-center">
						<Text className="text-muted-foreground">이미 계정이 있으신가요? </Text>
						<TouchableOpacity onPress={() => router.push("/(auth)/login")}>
							<Text className="text-primary font-semibold">로그인</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

