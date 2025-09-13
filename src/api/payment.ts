// import { postWithIdempotency } from './client'
import { mockApiDelay, mockRandomSuccess, mockErrors } from '@/data/mockData'

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
  },
}
