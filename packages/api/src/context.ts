import type { NextRequest } from "next/server";
import { auth } from "@qcard-better-t-stack/auth";
import { db } from "@qcard-better-t-stack/db";

export async function createContext(req: NextRequest) {
	const session = await auth.api.getSession({
		headers: req.headers,
	});
	return {
		session,
		db,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;