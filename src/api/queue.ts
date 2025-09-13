// import { apiClient, postWithIdempotency } from './client'
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
  join: async (_data: QueueJoinRequest): Promise<QueueJoinResponse> => {
    await mockApiDelay()

    if (!mockRandomSuccess(0.95)) {
      throw new Error(mockErrors.RATE_LIMITED.message)
    }

    // 더미 응답 반환
    return {
      waiting_token: `wtkn_${Date.now()}`,
      position_hint: Math.floor(Math.random() * 10000) + 1,
    }
  },

  /**
   * 대기열 상태를 조회합니다.
   */
  getStatus: async (_token: string): Promise<QueueStatusResponse> => {
    await mockApiDelay(500) // 짧은 딜레이로 폴링 시뮬레이션

    // 토큰별로 상태를 추적하기 위한 간단한 캐시
    const tokenKey = `queue_status_${_token}`
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
  },

  /**
   * 대기열에서 입장 허가를 요청합니다.
   */
  enter: async (_data: QueueEnterRequest): Promise<QueueEnterResponse> => {
    await mockApiDelay()

    if (!mockRandomSuccess(0.9)) {
      throw new Error(mockErrors.IDEMPOTENCY_CONFLICT.message)
    }

    return {
      admission: 'granted',
      reservation_token: `rtkn_${Date.now()}`,
      ttl_sec: 30,
    }
  },
}
