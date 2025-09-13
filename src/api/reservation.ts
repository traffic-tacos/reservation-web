// import { apiClient, postWithIdempotency } from './client'
import { mockReservations, mockApiDelay, mockRandomSuccess, mockErrors } from '@/data/mockData'

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

// API 함수들
export const reservationApi = {
  /**
   * 예약을 생성합니다.
   */
  create: async (data: ReservationCreateRequest): Promise<ReservationCreateResponse> => {
    await mockApiDelay()

    if (!mockRandomSuccess(0.9)) {
      throw new Error(mockErrors.INVENTORY_CONFLICT.message)
    }

    // 더미 예약 생성
    const newReservation = {
      id: `rsv_${Date.now()}`,
      event_id: data.event_id,
      seat_ids: data.seat_ids,
      quantity: data.quantity,
      reservation_token: data.reservation_token,
      user_id: data.user_id,
      hold_expires_at: new Date(Date.now() + 60000).toISOString(), // 1분 후 만료
    }

    return {
      reservation_id: newReservation.id,
      hold_expires_at: newReservation.hold_expires_at,
    }
  },

  /**
   * 예약을 확정합니다.
   */
  confirm: async (_reservationId: string, _data: ReservationConfirmRequest): Promise<ReservationConfirmResponse> => {
    await mockApiDelay()

    if (!mockRandomSuccess(0.95)) {
      throw new Error(mockErrors.RESERVATION_EXPIRED.message)
    }

    return {
      order_id: `ord_${Date.now()}`,
      status: 'CONFIRMED',
    }
  },

  /**
   * 예약을 취소합니다.
   */
  cancel: async (_reservationId: string): Promise<ReservationCancelResponse> => {
    await mockApiDelay()

    return {
      status: 'CANCELLED',
    }
  },

  /**
   * 예약 정보를 조회합니다.
   */
  get: async (reservationId: string) => {
    await mockApiDelay(300)

    const reservation = mockReservations.find(r => r.id === reservationId)
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다.')
    }

    return reservation
  },
}
