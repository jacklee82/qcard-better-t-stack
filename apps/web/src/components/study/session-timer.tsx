'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface SessionTimerProps {
  startTime: Date | string | number
  onTimeUpdate?: (seconds: number) => void
}

export function SessionTimer({ startTime, onTimeUpdate }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0)

  // 런타임에서 다양한 타입의 시간을 안전하게 타임스탬프로 변환
  const toStartMs = (value: Date | string | number) => {
    if (value instanceof Date) return value.getTime()
    if (typeof value === 'number') return value
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? Date.now() : parsed
  }

  useEffect(() => {
    const startMs = toStartMs(startTime)

    const tick = () => {
      const newElapsed = Math.floor((Date.now() - startMs) / 1000)
      setElapsed(newElapsed)
      onTimeUpdate?.(newElapsed)
    }

    // 초기 경과 시간 계산 및 즉시 반영
    tick()

    // 1초마다 업데이트
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startTime, onTimeUpdate])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="w-4 h-4" />
      <span className="font-mono">{formatTime(elapsed)}</span>
    </div>
  )
}

