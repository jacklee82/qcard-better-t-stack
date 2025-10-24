import { protectedProcedure, publicProcedure, router } from "../index";
import { questionRouter } from "./question";
import { progressRouter } from "./progress";
import { statsRouter } from "./stats";
import { bookmarkRouter } from "./bookmark";
import { sessionRouter } from "./session";
import { goalRouter } from "./goal";

export const appRouter = router({
	// Health check
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	
	// Test protected route
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),

	// Main routers
	question: questionRouter,
	progress: progressRouter,
	stats: statsRouter,
	bookmark: bookmarkRouter,
	session: sessionRouter,
	goal: goalRouter,
});

export type AppRouter = typeof appRouter;
