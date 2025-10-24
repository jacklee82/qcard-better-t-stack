import { Container } from "@/components/container";
import { ScrollView, Text, View, Switch, TouchableOpacity, Alert } from "react-native";
import { useColorScheme } from "@/lib/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/utils/trpc";
import { showToast } from "@/utils/toast";
import { useState } from "react";

export default function SettingsScreen() {
	const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
	const [autoNextQuestion, setAutoNextQuestion] = useState(false);
	const [soundEffects, setSoundEffects] = useState(true);
	
	const utils = trpc.useUtils();
	
	// 진도 초기화 mutation
	const resetProgress = trpc.progress.reset.useMutation({
		onSuccess: () => {
			utils.stats.getOverview.invalidate();
			utils.progress.getAll.invalidate();
			showToast.success("진도가 초기화되었습니다");
		},
		onError: (error) => {
			showToast.error("초기화 실패: " + error.message);
		},
	});

	return (
		<Container>
			<ScrollView className="flex-1">
				{/* 헤더 */}
				<View className="p-6 pb-4">
					<Text className="text-3xl font-bold text-foreground mb-2">
						설정
					</Text>
					<Text className="text-muted-foreground">
						앱 설정을 변경하세요
					</Text>
				</View>

				{/* 외관 설정 */}
				<View className="px-6 pb-6">
					<Text className="text-lg font-semibold text-foreground mb-3">
						외관
					</Text>
					<View className="bg-card rounded-xl border border-border overflow-hidden">
						<View className="p-4 flex-row items-center justify-between">
							<View className="flex-row items-center flex-1">
								<Ionicons
									name={isDarkColorScheme ? "moon" : "sunny"}
									size={24}
									color={isDarkColorScheme ? "hsl(217.2 91.2% 59.8%)" : "hsl(221.2 83.2% 53.3%)"}
								/>
								<View className="ml-3 flex-1">
									<Text className="text-foreground font-medium">
										다크 모드
									</Text>
									<Text className="text-muted-foreground text-xs">
										어두운 테마 사용
									</Text>
								</View>
							</View>
							<Switch
								value={isDarkColorScheme}
								onValueChange={(value) => {
									setColorScheme(value ? "dark" : "light");
								}}
							/>
						</View>
					</View>
				</View>

				{/* 학습 설정 */}
				<View className="px-6 pb-6">
					<Text className="text-lg font-semibold text-foreground mb-3">
						학습
					</Text>
					<View className="bg-card rounded-xl border border-border overflow-hidden">
						<View className="p-4 flex-row items-center justify-between border-b border-border">
							<View className="flex-row items-center flex-1">
								<Ionicons
									name="play-skip-forward-outline"
									size={24}
									color="#6366F1"
								/>
								<View className="ml-3 flex-1">
									<Text className="text-foreground font-medium">
										자동 다음 문제
									</Text>
									<Text className="text-muted-foreground text-xs">
										정답 확인 후 자동 이동
									</Text>
								</View>
							</View>
							<Switch
								value={autoNextQuestion}
								onValueChange={setAutoNextQuestion}
							/>
						</View>
						<View className="p-4 flex-row items-center justify-between">
							<View className="flex-row items-center flex-1">
								<Ionicons
									name="volume-high-outline"
									size={24}
									color="#6366F1"
								/>
								<View className="ml-3 flex-1">
									<Text className="text-foreground font-medium">
										소리 효과
									</Text>
									<Text className="text-muted-foreground text-xs">
										정답/오답 소리
									</Text>
								</View>
							</View>
							<Switch
								value={soundEffects}
								onValueChange={setSoundEffects}
							/>
						</View>
					</View>
				</View>

				{/* 데이터 관리 */}
				<View className="px-6 pb-6">
					<Text className="text-lg font-semibold text-foreground mb-3">
						데이터 관리
					</Text>
					<View className="bg-card rounded-xl border border-border overflow-hidden">
						<TouchableOpacity
							onPress={() => {
								Alert.alert(
									"진도 초기화",
									"모든 학습 기록이 삭제됩니다. 계속하시겠습니까?",
									[
										{ text: "취소", style: "cancel" },
										{
											text: "초기화",
											style: "destructive",
											onPress: () => resetProgress.mutate(),
										},
									]
								);
							}}
							className="p-4 flex-row items-center justify-between border-b border-border"
						>
							<View className="flex-row items-center flex-1">
								<Ionicons
									name="refresh-outline"
									size={24}
									color="#EF4444"
								/>
								<View className="ml-3 flex-1">
									<Text className="text-red-600 dark:text-red-400 font-medium">
										진도 초기화
									</Text>
									<Text className="text-muted-foreground text-xs">
										모든 학습 기록 삭제
									</Text>
								</View>
							</View>
							<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => {
								showToast.info("캐시 삭제 기능은 곧 추가될 예정입니다");
							}}
							className="p-4 flex-row items-center justify-between"
						>
							<View className="flex-row items-center flex-1">
								<Ionicons
									name="trash-outline"
									size={24}
									color="#6366F1"
								/>
								<View className="ml-3 flex-1">
									<Text className="text-foreground font-medium">
										캐시 삭제
									</Text>
									<Text className="text-muted-foreground text-xs">
										임시 데이터 정리
									</Text>
								</View>
							</View>
							<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
						</TouchableOpacity>
					</View>
				</View>

				{/* 알림 설정 */}
				<View className="px-6 pb-6">
					<Text className="text-lg font-semibold text-foreground mb-3">
						알림
					</Text>
					<View className="bg-card rounded-xl border border-border overflow-hidden">
						<View className="p-4 flex-row items-center justify-between border-b border-border">
							<View className="flex-row items-center flex-1">
								<Ionicons
									name="notifications-outline"
									size={24}
									color="#6366F1"
								/>
								<View className="ml-3 flex-1">
									<Text className="text-foreground font-medium">
										푸시 알림
									</Text>
									<Text className="text-muted-foreground text-xs">
										학습 리마인더 받기
									</Text>
								</View>
							</View>
							<Switch value={false} disabled />
						</View>
						<View className="p-4 flex-row items-center justify-between">
							<View className="flex-row items-center flex-1">
								<Ionicons
									name="time-outline"
									size={24}
									color="#6366F1"
								/>
								<View className="ml-3 flex-1">
									<Text className="text-foreground font-medium">
										일일 리마인더
									</Text>
									<Text className="text-muted-foreground text-xs">
										매일 학습 알림
									</Text>
								</View>
							</View>
							<Switch value={false} disabled />
						</View>
					</View>
					<Text className="text-muted-foreground text-xs mt-2 px-1">
						알림 기능은 곧 추가될 예정입니다.
					</Text>
				</View>

				{/* 앱 정보 */}
				<View className="px-6 pb-6">
					<Text className="text-lg font-semibold text-foreground mb-3">
						앱 정보
					</Text>
					<View className="bg-card rounded-xl border border-border overflow-hidden">
						<View className="p-4 flex-row items-center justify-between border-b border-border">
							<View className="flex-row items-center flex-1">
								<Ionicons
									name="information-circle-outline"
									size={24}
									color="#6366F1"
								/>
								<Text className="ml-3 text-foreground font-medium">
									버전
								</Text>
							</View>
							<Text className="text-muted-foreground">2.0.0-alpha</Text>
						</View>
						<TouchableOpacity
							onPress={() => showToast.info("이용약관 페이지는 곧 추가될 예정입니다")}
							className="p-4 flex-row items-center justify-between border-b border-border"
						>
							<View className="flex-row items-center flex-1">
								<Ionicons
									name="document-text-outline"
									size={24}
									color="#6366F1"
								/>
								<Text className="ml-3 text-foreground font-medium">
									이용약관
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => showToast.info("개인정보 처리방침은 곧 추가될 예정입니다")}
							className="p-4 flex-row items-center justify-between"
						>
							<View className="flex-row items-center flex-1">
								<Ionicons
									name="shield-checkmark-outline"
									size={24}
									color="#6366F1"
								/>
								<Text className="ml-3 text-foreground font-medium">
									개인정보 처리방침
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</Container>
	);
}

