import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

// FIX-0025: 인증 우회 모드 감지 (서버에서는 NEXT_PUBLIC_ 또는 일반 환경변수 사용)
const isBypassAuth = process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV === 'development';

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	// FIX-0025: BYPASS_AUTH 모드일 때 세션 체크 우회
	if (isBypassAuth) {
		// 더미 세션 객체 생성 (개발용)
		const bypassSession = {
			user: {
				id: "bypass-user-id",
				email: "bypass@example.com",
				name: "Bypass User",
			},
			session: {
				id: "bypass-session-id",
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
			},
		};
		
		return next({
			ctx: {
				...ctx,
				session: bypassSession,
			},
		});
	}

	// 정상 인증 모드: 세션 체크
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});