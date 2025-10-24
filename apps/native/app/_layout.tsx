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

const LIGHT_THEME: Theme = {
	...DefaultTheme,
	colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
	...DarkTheme,
	colors: NAV_THEME.dark,
};

export const unstable_settings = {
	initialRouteName: "(auth)",
};

function RootLayoutNav() {
	const { colorScheme, isDarkColorScheme } = useColorScheme();
	const segments = useSegments();
	const router = useRouter();
	const session = authClient.useSession();

	// 인증 가드
	useEffect(() => {
		const inAuthGroup = segments[0] === "(auth)";
		
		if (!session.isPending) {
			if (!session.data && !inAuthGroup) {
				// 로그인하지 않았고 인증 화면이 아니면 로그인으로 이동
				router.replace("/(auth)/login");
			} else if (session.data && inAuthGroup) {
				// 로그인했고 인증 화면이면 대시보드로 이동
				router.replace("/(drawer)/(tabs)/dashboard");
			}
		}
	}, [session, segments]);

	// 세션 로딩 중
	if (session.isPending) {
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

	// tRPC 클라이언트 생성 (Provider 내부에서)
	const [queryClient] = useState(() => new QueryClient());
	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: `${process.env.EXPO_PUBLIC_SERVER_URL}/api/trpc`,
					headers() {
						const headers = new Map<string, string>();
						const cookies = authClient.getCookie();
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
