/**
 * SessionTimer Native Component
 * FIX-0010 패턴 적용: Date 직렬화 처리
 */

import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SessionTimerProps {
	startTime: Date | string | number;
	onTimeUpdate?: (seconds: number) => void;
}

export function SessionTimer({ startTime, onTimeUpdate }: SessionTimerProps) {
	const [elapsed, setElapsed] = useState(0);

	// FIX-0010: 런타임에서 다양한 타입의 시간을 안전하게 타임스탬프로 변환
	const toStartMs = (value: Date | string | number) => {
		if (value instanceof Date) return value.getTime();
		if (typeof value === "number") return value;
		const parsed = Date.parse(value);
		return Number.isNaN(parsed) ? Date.now() : parsed;
	};

	useEffect(() => {
		const startMs = toStartMs(startTime);

		const tick = () => {
			const newElapsed = Math.floor((Date.now() - startMs) / 1000);
			setElapsed(newElapsed);
			onTimeUpdate?.(newElapsed);
		};

		// 초기 경과 시간 계산 및 즉시 반영
		tick();

		// 1초마다 업데이트
		const interval = setInterval(tick, 1000);
		return () => clearInterval(interval);
	}, [startTime, onTimeUpdate]);

	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
				.toString()
				.padStart(2, "0")}`;
		}
		return `${minutes}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<View className="flex-row items-center gap-2">
			<Ionicons name="time-outline" size={16} color="#9CA3AF" />
			<Text className="text-sm text-muted-foreground font-mono">
				{formatTime(elapsed)}
			</Text>
		</View>
	);
}

