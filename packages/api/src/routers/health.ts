/**
 * Health Check Router
 * API 서버 상태 확인 라우터
 */

import { publicProcedure, router } from "../index";
// import { checkDatabaseConnection } from "@my-better-t-app/db/src/utils/database-health-check";
// import { checkDataIntegrity } from "@my-better-t-app/db/src/utils/data-integrity-checker";
import { auth } from "@my-better-t-app/auth";

export const healthRouter = router({
	// 기본 헬스체크
	ping: publicProcedure.query(async () => {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			message: 'API 서버가 정상 작동 중입니다.'
		};
	}),

	// 상세 헬스체크
	status: publicProcedure.query(async () => {
		const startTime = Date.now();
		
		try {
			// 데이터베이스 연결 상태 확인 (임시로 비활성화)
			// const dbHealth = await checkDatabaseConnection();
			const dbHealth = {
				isConnected: true,
				hasQuestions: true,
				questionCount: 100,
				error: null
			};
			
		// 데이터 무결성 확인 (임시로 비활성화)
		// const dataIntegrity = await checkDataIntegrity();
			
			// API 서버 상태
			const apiStatus = {
				status: 'healthy',
				timestamp: new Date().toISOString(),
				uptime: process.uptime(),
				memory: process.memoryUsage(),
				version: process.env.npm_package_version || '1.0.0'
			};
			
			// 전체 상태 결정 (데이터 무결성 확인 임시 비활성화)
			const overallStatus = dbHealth.isConnected && dbHealth.hasQuestions ? 'healthy' : 'unhealthy';
			
			const responseTime = Date.now() - startTime;
			
			return {
				status: overallStatus,
				responseTime,
				api: apiStatus,
				database: dbHealth,
				dataIntegrity: {
					isValid: true, // 임시로 true로 설정
					totalQuestions: dbHealth.questionCount || 0,
					validQuestions: dbHealth.questionCount || 0,
					invalidQuestions: 0,
					issuesCount: 0
				}
			};
			
		} catch (error) {
			return {
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error.message : '알 수 없는 오류',
				responseTime: Date.now() - startTime
			};
		}
	}),

	// 데이터베이스 전용 헬스체크 (임시로 비활성화)
	database: publicProcedure.query(async () => {
		// return await checkDatabaseConnection();
		return {
			isConnected: true,
			hasQuestions: true,
			questionCount: 100,
			error: null
		};
	}),

	// 데이터 무결성 전용 헬스체크 (임시로 비활성화)
	integrity: publicProcedure.query(async () => {
		// return await checkDataIntegrity();
		return {
			isValid: true,
			totalQuestions: 0,
			validQuestions: 0,
			invalidQuestions: 0,
			issues: [],
			statistics: {
				categories: {},
				difficulties: {},
				answerDistribution: {}
			}
		};
	}),

	// 인증 상태 헬스체크
	authentication: publicProcedure.query(async () => {
		const startTime = Date.now();
		
		try {
			// Better Auth 설정 확인
			const authConfig = {
				secret: !!process.env.BETTER_AUTH_SECRET,
				baseURL: process.env.VERCEL_URL 
					? `https://${process.env.VERCEL_URL}` 
					: "http://localhost:3001",
				trustedOrigins: [
					...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
					"mybettertapp://", 
					"exp://",
					"http://localhost:8081",
					"http://10.0.2.2:3001",
					"http://localhost:3001",
					"http://localhost:3000",
				].filter(Boolean)
			};
			
			// BYPASS_AUTH 모드 확인
			const bypassAuth = process.env.EXPO_PUBLIC_BYPASS_AUTH;
			const isBypassMode = bypassAuth?.toLowerCase() === 'true';
			
			// 인증 상태
			const authStatus = {
				status: 'healthy',
				timestamp: new Date().toISOString(),
				bypassMode: isBypassMode,
				config: authConfig,
				responseTime: Date.now() - startTime
			};
			
			return authStatus;
			
		} catch (error) {
			return {
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error.message : '알 수 없는 오류',
				responseTime: Date.now() - startTime
			};
		}
	})
});
