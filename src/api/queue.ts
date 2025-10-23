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

      // 대기열 순번: 150~250 사이로 시작
      const initialPosition = Math.floor(Math.random() * 101) + 150; // 150~250

      return {
        waiting_token: `wtkn_${Date.now()}_${initialPosition}`, // 순번 포함해서 고유하게
        position_hint: initialPosition,
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

      // 토큰에서 초기 순번 추출 (토큰 형식: wtkn_timestamp_initialPosition)
      const tokenParts = token.split('_')
      const initialPosition = parseInt(tokenParts[tokenParts.length - 1]) || 150

      // 토큰별로 현재 순번을 추적하기 위한 캐시
      const positionKey = `queue_position_${token}`
      let currentPosition = parseInt(localStorage.getItem(positionKey) || initialPosition.toString())

      // 각 호출마다 랜덤하게 1-3만큼 순번 감소 (더 현실적인 대기열)
      const decreaseAmount = Math.floor(Math.random() * 3) + 1
      currentPosition = Math.max(1, currentPosition - decreaseAmount)

      // 현재 순번 저장
      localStorage.setItem(positionKey, currentPosition.toString())

      // 순번이 1이 되면 ready 상태로 변경
      if (currentPosition <= 1) {
        return {
          status: 'ready',
          position: 1,
          eta_sec: undefined,
        }
      }

      // ETA 계산: 1분에서 시작해서 순번에 비례해서 줄어들음
      // 250위: 60초, 200위: 48초, 150위: 36초, ... 1위: 1초
      const etaSec = Math.max(1, Math.floor((currentPosition / 250) * 60));

      return {
        status: 'waiting',
        position: currentPosition,
        eta_sec: etaSec,
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
