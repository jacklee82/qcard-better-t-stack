/**
 * Study Stack Navigator
 * 학습 모드 화면들을 위한 Stack 네비게이터
 */

import { Stack } from "expo-router";

export default function StudyLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: true,
				headerBackTitle: "뒤로",
				headerTintColor: "#6366F1",
			}}
		>
			<Stack.Screen
				name="sequential"
				options={{
					title: "순차 학습",
					headerBackVisible: true,
				}}
			/>
			<Stack.Screen
				name="random"
				options={{
					title: "랜덤 학습",
					headerBackVisible: true,
				}}
			/>
			<Stack.Screen
				name="category"
				options={{
					title: "카테고리 선택",
					headerBackVisible: true,
				}}
			/>
			<Stack.Screen
				name="[category]"
				options={{
					title: "카테고리 학습",
					headerBackVisible: true,
				}}
			/>
			<Stack.Screen
				name="review"
				options={{
					title: "오답 복습",
					headerBackVisible: true,
				}}
			/>
		</Stack>
	);
}

