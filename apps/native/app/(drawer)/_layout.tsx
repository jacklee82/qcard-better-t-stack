import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";

function CustomDrawerContent(props: any) {
	const router = useRouter();
	const session = authClient.useSession();

	const handleLogout = async () => {
		Alert.alert(
			"로그아웃",
			"정말 로그아웃하시겠습니까?",
			[
				{
					text: "취소",
					style: "cancel",
				},
				{
					text: "로그아웃",
					style: "destructive",
					onPress: async () => {
						await authClient.signOut();
						const BYPASS_AUTH = (process.env.EXPO_PUBLIC_BYPASS_AUTH ?? "true") === "true";
						if (BYPASS_AUTH) {
							// 인증 우회 중엔 로그인 화면으로 보내지 않고 학습 탭으로 이동
							router.replace("/(drawer)/(tabs)/study");
						} else {
							router.replace("/(auth)/login");
						}
					},
				},
			]
		);
	};

	return (
		<DrawerContentScrollView {...props} className="flex-1 bg-background">
			{/* 프로필 섹션 */}
			<View className="p-6 border-b border-border">
				<View className="w-16 h-16 bg-primary rounded-full items-center justify-center mb-3">
					<Text className="text-primary-foreground text-2xl font-bold">
						{session.data?.user?.name?.charAt(0).toUpperCase() || "U"}
					</Text>
				</View>
				<Text className="text-foreground font-bold text-lg">
					{session.data?.user?.name || "사용자"}
				</Text>
				<Text className="text-muted-foreground text-sm">
					{session.data?.user?.email || ""}
				</Text>
			</View>

			{/* 메뉴 아이템 */}
			<DrawerItemList {...props} />

			{/* 로그아웃 버튼 */}
			<View className="p-4 border-t border-border mt-auto">
				<TouchableOpacity
					onPress={handleLogout}
					className="flex-row items-center p-3 rounded-lg"
				>
					<Ionicons name="log-out-outline" size={24} color="hsl(0 84.2% 60.2%)" />
					<Text className="ml-3 text-destructive font-medium">로그아웃</Text>
				</TouchableOpacity>
			</View>
		</DrawerContentScrollView>
	);
}

export default function DrawerLayout() {
	return (
		<Drawer
			drawerContent={(props) => <CustomDrawerContent {...props} />}
			screenOptions={{
				headerShown: false,
				drawerActiveTintColor: "hsl(221.2 83.2% 53.3%)",
				drawerInactiveTintColor: "hsl(240 3.8% 46.1%)",
			}}
		>
			<Drawer.Screen
				name="(tabs)"
				options={{
					drawerLabel: "홈",
					drawerIcon: ({ size, color }) => (
						<Ionicons name="home-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="profile"
				options={{
					drawerLabel: "프로필",
					drawerIcon: ({ size, color }) => (
						<Ionicons name="person-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="settings"
				options={{
					drawerLabel: "설정",
					drawerIcon: ({ size, color }) => (
						<Ionicons name="settings-outline" size={size} color={color} />
					),
				}}
			/>
		</Drawer>
	);
}
