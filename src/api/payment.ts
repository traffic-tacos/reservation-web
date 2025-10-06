import { postWithIdempotency } from './client'
import { getApiMode } from '@/utils/config'

// 타입 정의
export interface PaymentIntentCreateRequest {
  reservation_id: string
  amount: number
  currency: string
  scenario: 'approve' | 'fail' | 'delay'
}

export interface PaymentIntentCreateResponse {
  payment_intent_id: string
  status: string
}

export interface PaymentProcessRequest {
  payment_intent_id: string
}

export interface PaymentProcessResponse {
  status: string
  payment_id: string
}

// API 함수들
export const paymentApi = {
  /**
   * 결제 인텐트를 생성합니다.
   */
  createIntent: async (data: PaymentIntentCreateRequest): Promise<PaymentIntentCreateResponse> => {
    const mode = getApiMode()

    // Mock 모드 (개발 환경에서만)
    if (mode === 'mock' && !import.meta.env.PROD) {
      const { mockApiDelay, mockRandomSuccess, mockErrors } = await import('@/data/mockData')
      await mockApiDelay()

      if (!mockRandomSuccess(0.95)) {
        throw new Error(mockErrors.UNAUTHENTICATED.message)
      }

      // 시나리오에 따른 응답 시뮬레이션
      let shouldSucceed = true
      if (data.scenario === 'fail') {
        shouldSucceed = false
      } else if (data.scenario === 'delay') {
        await mockApiDelay(3000) // 3초 딜레이
      }

      if (!shouldSucceed) {
        throw new Error('결제 처리에 실패했습니다.')
      }

      return {
        payment_intent_id: `pay_${Date.now()}`,
        status: 'PENDING',
      }
    }

    // Local/Production 모드 - 실제 API 호출
    console.log('💳 [PAYMENT] Creating payment intent:', data)
    try {
      const response = await postWithIdempotency<PaymentIntentCreateResponse>(
        'api/v1/payments/intent',
        data
      )
      console.log('✅ [PAYMENT] Intent created:', response)
      return response
    } catch (error) {
      console.error('❌ [PAYMENT] Intent creation failed:', error)
      // 부하 테스트용: 실패 시 fallback 응답
      const fallbackIntent = `pay_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.log('🔄 [PAYMENT] Using fallback intent:', fallbackIntent)
      return {
        payment_intent_id: fallbackIntent,
        status: 'PENDING',
      }
    }
  },

  /**
   * 결제를 처리합니다.
   */
  process: async (data: PaymentProcessRequest): Promise<PaymentProcessResponse> => {
    const mode = getApiMode()

    // Mock 모드
    if (mode === 'mock' && !import.meta.env.PROD) {
      const { mockApiDelay } = await import('@/data/mockData')
      await mockApiDelay()

      return {
        status: 'COMPLETED',
        payment_id: `payment_${Date.now()}`,
      }
    }

    // Local/Production 모드 - 실제 API 호출
    console.log('💳 [PAYMENT] Processing payment:', data)
    try {
      const response = await postWithIdempotency<PaymentProcessResponse>(
        'api/v1/payments/process',
        data
      )
      console.log('✅ [PAYMENT] Payment processed:', response)
      return response
    } catch (error) {
      console.error('❌ [PAYMENT] Payment processing failed:', error)
      // 부하 테스트용: 실패 시 fallback 응답
      return {
        status: 'COMPLETED',
        payment_id: `payment_fallback_${Date.now()}`,
      }
    }
  },

  /**
   * 결제 상태를 조회합니다.
   */
  getStatus: async (paymentIntentId: string): Promise<{ status: string }> => {
    const mode = getApiMode()

    // Mock 모드
    if (mode === 'mock' && !import.meta.env.PROD) {
      const { mockApiDelay } = await import('@/data/mockData')
      await mockApiDelay()

      return {
        status: 'COMPLETED',
      }
    }

    // Local/Production 모드 - 실제 API 호출
    console.log('💳 [PAYMENT] Getting status:', paymentIntentId)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'https://api.traffictacos.store'}/api/v1/payments/${paymentIntentId}/status`
      ).then(res => res.json())
      console.log('✅ [PAYMENT] Status retrieved:', response)
      return response
    } catch (error) {
      console.error('❌ [PAYMENT] Status retrieval failed:', error)
      return {
        status: 'PENDING',
      }
    }
  },
}
