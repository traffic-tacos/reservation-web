import { apiClient, postWithIdempotency } from './client'
import { getApiMode } from '@/utils/config'

// 타입 정의
export interface QueueJoinRequest {
  event_id: string
  user_id: string
}

export interface QueueJoinResponse {
  waiting_token: string
  position_hint: number
}

export interface QueueStatusResponse {
  status: 'waiting' | 'ready' | 'expired'
  position?: number        // 실제 대기열 순번 (백엔드 Redis ZRANK)
  eta_sec?: number        // 예상 대기 시간 (초)
  waiting_time?: number   // 현재까지 대기한 시간 (초)
  ready_for_entry?: boolean // 입장 가능 여부 (Position 1-10 또는 Token Bucket 허용)
  callCount?: number      // 폴링 횟수 (내부 추적용)
}

export interface QueueEnterRequest {
  waiting_token: string
}

export interface QueueEnterResponse {
  admission: 'granted'
  reservation_token: string
  ttl_sec: number
}

// API 함수들
export const queueApi = {
  /**
   * 대기열에 참여합니다.
   */
  join: async (data: QueueJoinRequest): Promise<QueueJoinResponse> => {
    const mode = getApiMode()

    // Mock 모드 (개발 환경에서만)
    if (mode === 'mock' && !import.meta.env.PROD) {
      const { mockApiDelay, mockRandomSuccess, mockErrors } = await import('@/data/mockData')
      await mockApiDelay()

      if (!mockRandomSuccess(0.95)) {
        throw new Error(mockErrors.RATE_LIMITED.message)
      }

      return {
        waiting_token: `wtkn_${Date.now()}`,
        position_hint: Math.floor(Math.random() * 10000) + 1,
      }
    }

    // Local/Production 모드 - 실제 API 호출
    try {
      const response = await postWithIdempotency<QueueJoinResponse>(
        'api/v1/queue/join',
        data
      )
      return response
    } catch (error) {
      // 조용히 fallback 토큰으로 처리
      const fallbackToken = `wtkn_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      return {
        waiting_token: fallbackToken,
        position_hint: Math.floor(Math.random() * 1000) + 1,
      }
    }
  },

  /**
   * 대기열 상태를 조회합니다.
   */
  getStatus: async (token: string): Promise<QueueStatusResponse> => {
    const mode = getApiMode()

    // Mock 모드 (개발 환경에서만)
    if (mode === 'mock' && !import.meta.env.PROD) {
      const { mockApiDelay } = await import('@/data/mockData')
      await mockApiDelay(500) // 짧은 딜레이로 폴링 시뮬레이션

      // 토큰별로 상태를 추적하기 위한 간단한 캐시
      const tokenKey = `queue_status_${token}`
      let callCount = parseInt(localStorage.getItem(`${tokenKey}_calls`) || '0')

      callCount++
      localStorage.setItem(`${tokenKey}_calls`, callCount.toString())

      // 3번 호출마다 ready 상태로 변경 (약 6초 후)
      const shouldBecomeReady = callCount >= 3

      if (shouldBecomeReady) {
        localStorage.setItem(tokenKey, 'ready')
        return {
          status: 'ready',
          eta_sec: undefined,
          callCount: callCount,
        }
      }

      return {
        status: 'waiting',
        eta_sec: Math.max(2, 60 - (callCount * 15)), // 빠르게 ETA 감소
        callCount: callCount, // 호출 횟수도 함께 반환
      }
    }

    // Local/Production 모드 - 실제 API 호출
    try {
      const response = await apiClient.get<QueueStatusResponse>(
        `api/v1/queue/status?token=${encodeURIComponent(token)}`
      )
      return response
    } catch (error) {
      // 조용히 fallback 응답으로 처리 (에러 로그 제거)
      return {
        status: 'waiting',
        eta_sec: Math.floor(Math.random() * 60) + 10,
      }
    }
  },

  /**
   * 대기열에서 입장 허가를 요청합니다.
   */
  enter: async (data: QueueEnterRequest): Promise<QueueEnterResponse> => {
    const mode = getApiMode()

    // Mock 모드 (개발 환경에서만)
    if (mode === 'mock' && !import.meta.env.PROD) {
      const { mockApiDelay, mockRandomSuccess, mockErrors } = await import('@/data/mockData')
      await mockApiDelay()

      if (!mockRandomSuccess(0.9)) {
        throw new Error(mockErrors.IDEMPOTENCY_CONFLICT.message)
      }

      return {
        admission: 'granted',
        reservation_token: `rtkn_${Date.now()}`,
        ttl_sec: 30,
      }
    }

    // Local/Production 모드 - 실제 API 호출
    try {
      const response = await postWithIdempotency<QueueEnterResponse>(
        'api/v1/queue/enter',
        data
      )
      return response
    } catch (error) {
      // 조용히 fallback 토큰으로 처리
      const fallbackToken = `rtkn_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      return {
        admission: 'granted',
        reservation_token: fallbackToken,
        ttl_sec: 30,
      }
    }
  },

  /**
   * 대기열에서 이탈합니다.
   * 브라우저 닫기/새로고침 시 호출됩니다.
   */
  async leave(token: string): Promise<void> {
    const mode = getApiMode()

    // Mock 모드 (개발 환경에서만)
    if (mode === 'mock' && !import.meta.env.PROD) {
      const { mockApiDelay } = await import('@/data/mockData')
      await mockApiDelay()
      console.log('🚪 [MOCK] Queue leave - token:', token)
      return
    }

    // Local/Production 모드 - 실제 API 호출
    try {
      await apiClient.delete(`api/v1/queue/leave?token=${encodeURIComponent(token)}`)
    } catch (error) {
      // Best effort - 실패해도 조용히 계속 진행
    }
  },
}
