import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

export const authClient = createAuthClient({
	baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
	fetchOptions: {
		// Native 앱에서 origin 헤더 명시
		headers: {
			"Origin": Constants.expoConfig?.scheme 
				? `${Constants.expoConfig.scheme}://` 
				: "mybettertapp://",
		},
	},
	plugins: [
		expoClient({
			scheme: Constants.expoConfig?.scheme as string,
			storagePrefix: Constants.expoConfig?.scheme as string,
			storage: SecureStore,
		}),
	],
});
