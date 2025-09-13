import { useState, useEffect, useCallback } from 'react'

interface UseCountDownOptions {
  initialSeconds: number
  onComplete?: () => void
  autoStart?: boolean
}

/**
 * 카운트다운 타이머 훅
 */
export function useCountDown({
  initialSeconds,
  onComplete,
  autoStart = true
}: UseCountDownOptions) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isActive, setIsActive] = useState(autoStart)

  // 타이머 시작
  const start = useCallback(() => {
    setIsActive(true)
  }, [])

  // 타이머 정지
  const stop = useCallback(() => {
    setIsActive(false)
  }, [])

  // 타이머 리셋
  const reset = useCallback(() => {
    setSeconds(initialSeconds)
    setIsActive(false)
  }, [initialSeconds])

  // 시간 포맷팅
  const formatTime = useCallback((totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 진행률 계산 (0-100)
  const progress = Math.max(0, Math.min(100, ((initialSeconds - seconds) / initialSeconds) * 100))

  useEffect(() => {
    let interval: number | null = null

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const newValue = prev - 1
          if (newValue <= 0) {
            setIsActive(false)
            onComplete?.()
            return 0
          }
          return newValue
        })
      }, 1000)
    } else if (seconds === 0) {
      setIsActive(false)
      onComplete?.()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, seconds, onComplete])

  return {
    seconds,
    isActive,
    progress,
    start,
    stop,
    reset,
    formatTime,
    formattedTime: formatTime(seconds),
    isExpired: seconds === 0,
  }
}
