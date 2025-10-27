import { Container } from "@/components/container";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { trpc } from "@/utils/trpc";

export default function StudyScreen() {
	const router = useRouter();
	const { data: totalCount = 0 } = trpc.question.getCount.useQuery();

	const studyModes = [
		{
			id: "sequential",
			title: "순차 학습",
			description: `전체 ${totalCount}문제를 순서대로`,
			icon: "list" as const,
			color: "hsl(221.2 83.2% 53.3%)",
			bgColor: "bg-blue-500/10",
		},
		{
			id: "random",
			title: "랜덤 학습",
			description: "무작위 10문제",
			icon: "shuffle" as const,
			color: "hsl(262.1 83.3% 57.8%)",
			bgColor: "bg-purple-500/10",
		},
		{
			id: "category",
			title: "카테고리별 학습",
			description: "원하는 주제만 선택",
			icon: "folder" as const,
			color: "hsl(142.1 76.2% 36.3%)",
			bgColor: "bg-green-500/10",
		},
		{
			id: "review",
			title: "오답 복습",
			description: "틀렸던 문제 다시 풀기",
			icon: "refresh" as const,
			color: "hsl(24.6 95% 53.1%)",
			bgColor: "bg-amber-500/10",
		},
	];

	return (
		<Container>
			<ScrollView className="flex-1">
				{/* 헤더 */}
				<View className="p-6 pb-4">
					<Text className="text-3xl font-bold text-foreground mb-2">
						학습 모드 선택
					</Text>
					<Text className="text-muted-foreground">
						원하는 학습 방식을 선택하세요
					</Text>
				</View>

				{/* 학습 모드 카드 */}
				<View className="px-6 pb-6 gap-4">
					{studyModes.map((mode) => (
						<TouchableOpacity
							key={mode.id}
							onPress={() => {
								router.push(`/(study)/${mode.id}` as any);
							}}
							className="p-5 bg-card rounded-xl border border-border"
						>
							<View className="flex-row items-center">
								<View
									className={`w-14 h-14 ${mode.bgColor} rounded-full items-center justify-center mr-4`}
								>
									<Ionicons name={mode.icon} size={28} color={mode.color} />
								</View>
								<View className="flex-1">
									<Text className="text-foreground font-bold text-lg mb-1">
										{mode.title}
									</Text>
									<Text className="text-muted-foreground text-sm">
										{mode.description}
									</Text>
								</View>
								<Ionicons
									name="chevron-forward"
									size={24}
									color="hsl(240 3.8% 46.1%)"
								/>
							</View>
						</TouchableOpacity>
					))}
				</View>

				{/* 도움말 */}
				<View className="px-6 pb-6">
					<View className="p-4 bg-muted/50 rounded-lg border border-border">
						<View className="flex-row items-start">
							<Ionicons
								name="information-circle"
								size={20}
								color="hsl(221.2 83.2% 53.3%)"
								style={{ marginTop: 2 }}
							/>
							<View className="flex-1 ml-3">
								<Text className="text-foreground font-semibold text-sm mb-1">
									학습 팁
								</Text>
								<Text className="text-muted-foreground text-xs leading-5">
									• 순차 학습: 체계적으로 모든 문제 학습{"\n"}
									• 랜덤 학습: 실전 감각 향상{"\n"}
									• 카테고리별: 약점 집중 공략{"\n"}
									• 오답 복습: 틀린 문제 완벽 마스터
								</Text>
							</View>
						</View>
					</View>
				</View>
			</ScrollView>
		</Container>
	);
}

