/**
 * CodeBlock Native Component
 * 단순 Text + monospace 폰트 방식
 * Web의 react-syntax-highlighter 대체
 */

import { View, Text, ScrollView } from "react-native";

interface CodeBlockProps {
	code: string;
}

export function CodeBlock({ code }: CodeBlockProps) {
	return (
		<View className="bg-muted rounded-lg border border-border overflow-hidden">
			<View className="px-3 py-2 bg-muted/50 border-b border-border">
				<Text className="text-xs text-muted-foreground font-semibold">
					Python
				</Text>
			</View>
			<ScrollView horizontal showsHorizontalScrollIndicator={false}>
				<View className="p-4">
					<Text
						className="text-foreground text-sm leading-6"
						style={{ fontFamily: "monospace" }}
					>
						{code}
					</Text>
				</View>
			</ScrollView>
		</View>
	);
}

