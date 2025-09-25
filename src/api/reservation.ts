import { getApiMode } from '@/utils/config'
import { realReservationApi } from './reservationReal'

// 타입 정의
export interface ReservationCreateRequest {
  event_id: string
  seat_ids: string[]
  quantity: number
  reservation_token: string
  user_id: string
}

export interface ReservationCreateResponse {
  reservation_id: string
  hold_expires_at: string
}

export interface ReservationConfirmRequest {
  payment_intent_id: string
}

export interface ReservationConfirmResponse {
  order_id: string
  status: string
}

export interface ReservationCancelResponse {
  status: string
}

/**
 * API 모드에 따라 적절한 구현체를 선택하는 스마트 스위처
 */
function getReservationApiImplementation() {
  const mode = getApiMode()

  switch (mode) {
    case 'mock':
      // 프로덕션 빌드에서는 mock을 완전히 제외
      if (import.meta.env.PROD) {
        console.warn('Mock API not available in production, using real API')
        return Promise.resolve(realReservationApi)
      }
      return import('./reservationMock').then(module => module.mockReservationApi)
    case 'local':
    case 'production':
      return Promise.resolve(realReservationApi)
    default:
      console.warn(`Unknown API mode: ${mode}, falling back to real API`)
      return Promise.resolve(realReservationApi)
  }
}

// API 함수들 - 런타임에 적절한 구현체로 라우팅
export const reservationApi = {
  /**
   * 예약을 생성합니다.
   */
  create: async (data: ReservationCreateRequest): Promise<ReservationCreateResponse> => {
    const impl = await getReservationApiImplementation()
    return impl.create(data)
  },

  /**
   * 예약을 확정합니다.
   */
  confirm: async (reservationId: string, data: ReservationConfirmRequest): Promise<ReservationConfirmResponse> => {
    const impl = await getReservationApiImplementation()
    return impl.confirm(reservationId, data)
  },

  /**
   * 예약을 취소합니다.
   */
  cancel: async (reservationId: string): Promise<ReservationCancelResponse> => {
    const impl = await getReservationApiImplementation()
    return impl.cancel(reservationId)
  },

  /**
   * 예약 정보를 조회합니다.
   */
  get: async (reservationId: string) => {
    const impl = await getReservationApiImplementation()
    return impl.get(reservationId)
  },
}
