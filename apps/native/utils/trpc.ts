import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@my-better-t-app/api/routers/index";

export const trpc = createTRPCReact<AppRouter>();
