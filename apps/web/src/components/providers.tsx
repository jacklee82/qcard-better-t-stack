"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { trpc, queryClient, trpcClient } from "@/utils/trpc";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
	const [_trpcClient] = useState(() => trpcClient);

	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<trpc.Provider client={_trpcClient} queryClient={queryClient}>
				<QueryClientProvider client={queryClient}>
					{children}
					<ReactQueryDevtools />
				</QueryClientProvider>
			</trpc.Provider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
