import { Container } from "@/components/container";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import { authClient } from "@/lib/auth-client";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/utils/trpc";

export default function ProfileScreen() {
	const session = authClient.useSession();
	
	// FIX-0008: 배열 기본값 가드
	const { data: stats, isLoading: statsLoading } = trpc.stats.getOverview.useQuery();
	const { data: recentActivity = [], isLoading: activityLoading } = 
		trpc.stats.getRecentActivity.useQuery({ limit: 5 });

	return (
		<Container>
			<ScrollView className="flex-1">
				{/* 헤더 */}
				<View className="p-6 pb-4">
					<Text className="text-3xl font-bold text-foreground mb-2">
						프로필
					</Text>
					<Text className="text-muted-foreground">
						내 정보를 확인하세요
					</Text>
				</View>

				{/* 프로필 카드 */}
				<View className="px-6 pb-6">
					<View className="p-6 bg-card rounded-xl border border-border items-center">
						<View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-4">
							<Text className="text-primary-foreground text-4xl font-bold">
								{session.data?.user?.name?.charAt(0).toUpperCase() || "U"}
							</Text>
						</View>
						<Text className="text-foreground font-bold text-2xl mb-1">
							{session.data?.user?.name || "사용자"}
						</Text>
						<Text className="text-muted-foreground text-sm mb-4">
							{session.data?.user?.email || ""}
						</Text>
						<View className="flex-row items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
							<Ionicons name="shield-checkmark" size={16} color="hsl(221.2 83.2% 53.3%)" />
							<Text className="text-primary text-xs font-medium">
								인증된 사용자
							</Text>
						</View>
					</View>
				</View>

				{/* 계정 정보 */}
				<View className="px-6 pb-6">
					<Text className="text-lg font-semibold text-foreground mb-3">
						계정 정보
					</Text>
					<View className="bg-card rounded-xl border border-border overflow-hidden">
						<View className="p-4 border-b border-border">
							<Text className="text-muted-foreground text-xs mb-1">이름</Text>
							<Text className="text-foreground font-medium">
								{session.data?.user?.name || "-"}
							</Text>
						</View>
						<View className="p-4 border-b border-border">
							<Text className="text-muted-foreground text-xs mb-1">이메일</Text>
							<Text className="text-foreground font-medium">
								{session.data?.user?.email || "-"}
							</Text>
						</View>
						<View className="p-4">
							<Text className="text-muted-foreground text-xs mb-1">가입일</Text>
							<Text className="text-foreground font-medium">
								{session.data?.user?.createdAt 
									? new Date(session.data.user.createdAt).toLocaleDateString("ko-KR")
									: "-"}
							</Text>
						</View>
					</View>
				</View>

				{/* 학습 통계 요약 */}
				<View className="px-6 pb-6">
					<Text className="text-lg font-semibold text-foreground mb-3">
						학습 통계
					</Text>
					{statsLoading ? (
						<View className="p-6 bg-card rounded-xl border border-border items-center">
							<ActivityIndicator size="small" color="#6366F1" />
						</View>
					) : (
						<View className="gap-3">
							{/* 통계 카드 그리드 */}
							<View className="flex-row gap-3">
								<View className="flex-1 p-4 bg-card rounded-xl border border-border">
									<View className="flex-row items-center gap-2 mb-2">
										<Ionicons name="checkmark-circle" size={20} color="#22C55E" />
										<Text className="text-muted-foreground text-xs">정답률</Text>
									</View>
									<Text className="text-foreground font-bold text-2xl">
										{stats?.accuracy ? Math.round(stats.accuracy * 100) : 0}%
									</Text>
								</View>
								<View className="flex-1 p-4 bg-card rounded-xl border border-border">
									<View className="flex-row items-center gap-2 mb-2">
										<Ionicons name="flame" size={20} color="#F59E0B" />
										<Text className="text-muted-foreground text-xs">연속 학습</Text>
									</View>
									<Text className="text-foreground font-bold text-2xl">
										{stats?.streak || 0}일
									</Text>
								</View>
							</View>

							<View className="flex-row gap-3">
								<View className="flex-1 p-4 bg-card rounded-xl border border-border">
									<View className="flex-row items-center gap-2 mb-2">
										<Ionicons name="list" size={20} color="#3B82F6" />
										<Text className="text-muted-foreground text-xs">총 문제</Text>
									</View>
									<Text className="text-foreground font-bold text-2xl">
										{stats?.totalQuestionsAnswered || 0}
									</Text>
								</View>
								<View className="flex-1 p-4 bg-card rounded-xl border border-border">
									<View className="flex-row items-center gap-2 mb-2">
										<Ionicons name="trophy" size={20} color="#A855F7" />
										<Text className="text-muted-foreground text-xs">정답 수</Text>
									</View>
									<Text className="text-foreground font-bold text-2xl">
										{stats?.totalCorrectAnswers || 0}
									</Text>
								</View>
							</View>
						</View>
					)}
				</View>

				{/* 최근 활동 */}
				<View className="px-6 pb-6">
					<Text className="text-lg font-semibold text-foreground mb-3">
						최근 활동
					</Text>
					{activityLoading ? (
						<View className="p-6 bg-card rounded-xl border border-border items-center">
							<ActivityIndicator size="small" color="#6366F1" />
						</View>
					) : recentActivity.length === 0 ? (
						<View className="p-6 bg-card rounded-xl border border-border items-center">
							<Ionicons name="time-outline" size={40} color="#9CA3AF" />
							<Text className="text-muted-foreground text-sm mt-2">
								아직 학습 기록이 없습니다
							</Text>
						</View>
					) : (
						<View className="bg-card rounded-xl border border-border overflow-hidden">
							{recentActivity.map((activity, index) => (
								<View
									key={activity.questionId}
									className={`p-4 ${
										index < recentActivity.length - 1 ? "border-b border-border" : ""
									}`}
								>
									<View className="flex-row items-center justify-between mb-1">
										<Text className="text-foreground font-medium flex-1" numberOfLines={1}>
											{activity.category}
										</Text>
										<View
											className={`px-2 py-1 rounded ${
												activity.isCorrect ? "bg-green-500/10" : "bg-red-500/10"
											}`}
										>
											<Text
												className={`text-xs font-medium ${
													activity.isCorrect
														? "text-green-600 dark:text-green-400"
														: "text-red-600 dark:text-red-400"
												}`}
											>
												{activity.isCorrect ? "정답" : "오답"}
											</Text>
										</View>
									</View>
									<Text className="text-muted-foreground text-xs">
										{/* FIX-0010: Date 직렬화 처리 */}
										{new Date(activity.lastAttemptedAt).toLocaleDateString("ko-KR", {
											month: "short",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</Text>
								</View>
							))}
						</View>
					)}
				</View>
			</ScrollView>
		</Container>
	);
}

