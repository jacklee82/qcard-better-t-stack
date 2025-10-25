import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { Stack, useRouter, useSegments } from "expo-router";
import {
	DarkTheme,
	DefaultTheme,
	type Theme,
	ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { trpc } from "@/utils/trpc";
import { NAV_THEME } from "@/lib/constants";
import React, { useRef, useEffect, useState } from "react";
import { useColorScheme } from "@/lib/use-color-scheme";
import { Platform } from "react-native";
import { setAndroidNavigationBar } from "@/lib/android-navigation-bar";
import { authClient } from "@/lib/auth-client";
import { ErrorBoundary } from "@/components/error-boundary";
import Toast from "react-native-toast-message";
import { logEnvironmentInfo, validateEnvironment } from "@/env-config";

const LIGHT_THEME: Theme = {
	...DefaultTheme,
	colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
	...DarkTheme,
	colors: NAV_THEME.dark,
};

export const unstable_settings = {
	initialRouteName:
		(process.env.EXPO_PUBLIC_BYPASS_AUTH ?? "true") === "true"
			? "(drawer)"
			: "(auth)",
};

function RootLayoutNav() {
	const { colorScheme, isDarkColorScheme } = useColorScheme();
	const segments = useSegments();
	const router = useRouter();
	const session = authClient.useSession();
	const BYPASS_AUTH = (process.env.EXPO_PUBLIC_BYPASS_AUTH ?? "true") === "true";

	// 인증 가드
	useEffect(() => {
		const inAuthGroup = segments[0] === "(auth)";

		if (BYPASS_AUTH) {
			// 인증 우회 시, 인증 그룹에 있으면 학습 탭으로 이동
			if (inAuthGroup) {
				router.replace("/(drawer)/(tabs)/study");
			}
			return;
		}

		if (!session.isPending) {
			if (!session.data && !inAuthGroup) {
				// 로그인하지 않았고 인증 화면이 아니면 로그인으로 이동
				router.replace("/(auth)/login");
			} else if (session.data && inAuthGroup) {
				// 로그인했고 인증 화면이면 대시보드로 이동
				router.replace("/(drawer)/(tabs)/dashboard");
			}
		}
	}, [session, segments, BYPASS_AUTH]);

	// 세션 로딩 중 (인증 우회 시에는 대기하지 않음)
	if (!BYPASS_AUTH && session.isPending) {
		return null; // 또는 LoadingSpinner
	}

	return (
		<ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
			<StatusBar style={isDarkColorScheme ? "light" : "dark"} />
			<GestureHandlerRootView style={{ flex: 1 }}>
				<Stack screenOptions={{ headerShown: false }}>
					<Stack.Screen name="(auth)" />
					<Stack.Screen name="(drawer)" />
					<Stack.Screen
						name="modal"
						options={{ title: "Modal", presentation: "modal" }}
					/>
				</Stack>
				<Toast />
			</GestureHandlerRootView>
		</ThemeProvider>
	);
}

export default function RootLayout() {
	const hasMounted = useRef(false);
	const { colorScheme } = useColorScheme();
	const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

	// 환경변수 검증 및 로깅
	useEffect(() => {
		logEnvironmentInfo();
		const validation = validateEnvironment();
		if (!validation.isValid) {
			console.error('환경변수 설정에 문제가 있습니다. .env 파일을 확인해주세요.');
		}
	}, []);

	// tRPC 클라이언트 생성 (Provider 내부에서)
	const [queryClient] = useState(() => new QueryClient());
	
	// FIX-0025: BYPASS_AUTH 모드 감지
	const BYPASS_AUTH = (process.env.EXPO_PUBLIC_BYPASS_AUTH ?? "true") === "true";
	
	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: `${process.env.EXPO_PUBLIC_SERVER_URL}/api/trpc`,
					headers() {
						const headers = new Map<string, string>();
						
						// FIX-0025: 인증 우회 모드에서도 쿠키 설정 (서버가 더미 세션 사용)
						let cookies = authClient.getCookie();
						if (!cookies && BYPASS_AUTH) {
							// 인증 우회 모드: 더미 쿠키 생성
							cookies = "bypass-mode=true";
							console.log("🔐 tRPC Session (Bypass):", "✅ Dummy cookie injected");
						} else if (cookies) {
							console.log("🔐 tRPC Session:", "✅ Cookie exists");
						} else {
							console.log("🔐 tRPC Session:", "❌ No cookie");
						}
						
						if (cookies) {
							headers.set("Cookie", cookies);
						}
						return Object.fromEntries(headers);
					},
				}),
			],
		})
	);

	useIsomorphicLayoutEffect(() => {
		if (hasMounted.current) {
			return;
		}

		if (Platform.OS === "web") {
			document.documentElement.classList.add("bg-background");
		}
		setAndroidNavigationBar(colorScheme);
		setIsColorSchemeLoaded(true);
		hasMounted.current = true;
	}, []);

	if (!isColorSchemeLoaded) {
		return null;
	}

	return (
		<ErrorBoundary>
			<trpc.Provider client={trpcClient} queryClient={queryClient}>
				<QueryClientProvider client={queryClient}>
					<RootLayoutNav />
				</QueryClientProvider>
			</trpc.Provider>
		</ErrorBoundary>
	);
}

const useIsomorphicLayoutEffect =
	Platform.OS === "web" && typeof window === "undefined"
		? React.useEffect
		: React.useLayoutEffect;
