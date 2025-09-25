// import { postWithIdempotency } from './client'

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

// API 함수들
export const paymentApi = {
  /**
   * 결제 인텐트를 생성합니다.
   */
  createIntent: async (data: PaymentIntentCreateRequest): Promise<PaymentIntentCreateResponse> => {
    // Mock 모드 (개발 환경에서만)
    if (!import.meta.env.PROD) {
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

    // 프로덕션에서는 실제 API 호출 (미구현)
    throw new Error('Payment API not implemented for production')
  },
}
