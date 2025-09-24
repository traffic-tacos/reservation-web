import { apiClient, postWithIdempotency } from './client'
import { getApiMode } from '@/utils/config'
import { mockApiDelay, mockRandomSuccess, mockErrors } from '@/data/mockData'

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
  eta_sec?: number
  callCount?: number
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
    console.log('🔥 Queue join called - API Mode:', mode, 'Data:', data)

    // Mock 모드
    if (mode === 'mock') {
      console.log('📝 Using mock mode for queue join')
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
    console.log('🌐 Using API mode for queue join - calling real API')
    try {
      const response = await postWithIdempotency<QueueJoinResponse>(
        'api/v1/queue/join',
        data
      )
      console.log('✅ Queue join API success:', response)
      return response
    } catch (error) {
      console.error('❌ Queue join API failed:', error)
      // API 실패 시 mock 응답으로 fallback
      console.log('🔄 Falling back to mock response')
      return {
        waiting_token: `wtkn_fallback_${Date.now()}`,
        position_hint: Math.floor(Math.random() * 1000) + 1,
      }
    }
  },

  /**
   * 대기열 상태를 조회합니다.
   */
  getStatus: async (token: string): Promise<QueueStatusResponse> => {
    const mode = getApiMode()

    // Mock 모드
    if (mode === 'mock') {
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
      console.error('Queue status API failed:', error)
      // API 실패 시 mock 응답으로 fallback
      return {
        status: 'waiting',
        eta_sec: 30,
      }
    }
  },

  /**
   * 대기열에서 입장 허가를 요청합니다.
   */
  enter: async (data: QueueEnterRequest): Promise<QueueEnterResponse> => {
    const mode = getApiMode()

    // Mock 모드
    if (mode === 'mock') {
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
      console.error('Queue enter API failed:', error)
      // API 실패 시 mock 응답으로 fallback
      return {
        admission: 'granted',
        reservation_token: `rtkn_fallback_${Date.now()}`,
        ttl_sec: 30,
      }
    }
  },
}
