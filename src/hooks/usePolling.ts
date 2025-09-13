import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface UsePollingOptions {
  queryKey: string[]
  interval: number
  enabled?: boolean
  maxAttempts?: number
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * 폴링을 위한 커스텀 훅
 * 지정된 쿼리를 주기적으로 다시 가져옵니다.
 */
export function usePolling({
  queryKey,
  interval,
  enabled = true,
  maxAttempts,
  onSuccess,
  onError,
}: UsePollingOptions) {
  const queryClient = useQueryClient()
  const intervalRef = useRef<number | null>(null)
  const attemptsRef = useRef(0)

  // 폴링 시작
  const startPolling = useCallback(() => {
    if (intervalRef.current) return

    intervalRef.current = setInterval(async () => {
      try {
        await queryClient.invalidateQueries({ queryKey })
        attemptsRef.current += 1

        // 최대 시도 횟수 체크
        if (maxAttempts && attemptsRef.current >= maxAttempts) {
          stopPolling()
          return
        }

        onSuccess?.()
      } catch (error) {
        onError?.(error as Error)
      }
    }, interval)
  }, [queryClient, queryKey, interval, maxAttempts, onSuccess, onError])

  // 폴링 정지
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    attemptsRef.current = 0
  }, [])

  // 폴링 재시작
  const restartPolling = useCallback(() => {
    stopPolling()
    attemptsRef.current = 0
    startPolling()
  }, [startPolling, stopPolling])

  useEffect(() => {
    if (enabled) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, startPolling, stopPolling])

  return {
    startPolling,
    stopPolling,
    restartPolling,
    isPolling: !!intervalRef.current,
    attempts: attemptsRef.current,
  }
}

/**
 * 지수 백오프를 사용하는 폴링 훅
 */
export function usePollingWithBackoff({
  queryKey,
  initialInterval,
  maxInterval = 30000,
  multiplier = 2,
  enabled = true,
  maxAttempts,
  onSuccess,
  onError,
}: Omit<UsePollingOptions, 'interval'> & {
  initialInterval: number
  maxInterval?: number
  multiplier?: number
}) {
  const queryClient = useQueryClient()
  const intervalRef = useRef<number | null>(null)
  const currentIntervalRef = useRef(initialInterval)
  const attemptsRef = useRef(0)

  const startPolling = useCallback(() => {
    if (intervalRef.current) return

    const poll = async () => {
      try {
        await queryClient.invalidateQueries({ queryKey })
        attemptsRef.current += 1

        // 최대 시도 횟수 체크
        if (maxAttempts && attemptsRef.current >= maxAttempts) {
          stopPolling()
          return
        }

        onSuccess?.()

        // 다음 인터벌 계산 (지수 백오프)
        currentIntervalRef.current = Math.min(
          currentIntervalRef.current * multiplier,
          maxInterval
        )

        // 다음 폴링 예약
        intervalRef.current = setTimeout(poll, currentIntervalRef.current)
      } catch (error) {
        onError?.(error as Error)

        // 에러 시에도 백오프 적용
        currentIntervalRef.current = Math.min(
          currentIntervalRef.current * multiplier,
          maxInterval
        )

        intervalRef.current = setTimeout(poll, currentIntervalRef.current)
      }
    }

    poll()
  }, [queryClient, queryKey, maxAttempts, multiplier, maxInterval, onSuccess, onError])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current)
      intervalRef.current = null
    }
    attemptsRef.current = 0
    currentIntervalRef.current = initialInterval
  }, [initialInterval])

  const restartPolling = useCallback(() => {
    stopPolling()
    startPolling()
  }, [startPolling, stopPolling])

  useEffect(() => {
    if (enabled) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, startPolling, stopPolling])

  return {
    startPolling,
    stopPolling,
    restartPolling,
    isPolling: !!intervalRef.current,
    attempts: attemptsRef.current,
    currentInterval: currentIntervalRef.current,
  }
}
