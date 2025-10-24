import { expo } from '@better-auth/expo';
import { nextCookies } from 'better-auth/next-js';
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@my-better-t-app/db";
import * as schema from "@my-better-t-app/db/schema/auth";

export const auth = betterAuth<BetterAuthOptions>({
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.VERCEL_URL
		? `https://${process.env.VERCEL_URL}`
		: "http://localhost:3001",
	database: drizzleAdapter(db, {
		provider: "pg",

		schema: schema,
	}),
	trustedOrigins: [
		...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
		"mybettertapp://", 
		"exp://",
		"http://localhost:8081", // Expo Dev Server
		"http://10.0.2.2:3001", // Android Emulator
		"http://localhost:3001", // iOS Simulator
		"http://localhost:3000", // Local Web
	].filter(Boolean),
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		// Native 앱에서 origin 헤더가 없을 수 있으므로 허용
		useSecureCookies: process.env.NODE_ENV === "production",
		crossSubDomainCookies: {
			enabled: true,
		},
	},
	plugins: [nextCookies(), expo()]
});
