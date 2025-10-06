import { apiClient, postWithIdempotency } from './client'
import { getApiPrefix } from '@/utils/config'
import type {
  ReservationCreateRequest,
  ReservationCreateResponse,
  ReservationConfirmRequest,
  ReservationConfirmResponse,
  ReservationCancelResponse,
} from './reservation'

// 실제 API와 맞춤형 타입 정의 (reservation-api와 호환)
interface ApiReservationCreateRequest {
  event_id: string
  seat_ids: string[]
  quantity: number
  reservation_token: string  // 🔑 입장 토큰 (필수)
  user_id: string
}

interface ApiReservationCreateResponse {
  reservation_id: string
  status: string
  hold_expires_at: string
  reserved_seats?: Array<{
    id: string
    section: string
    row: string
    number: string
  }>
  total_amount?: {
    amount: number
    currency: string
  }
  payment_url?: string
}

interface ApiReservationConfirmRequest {
  reservation_id: string
  user_id: string
  payment_intent_id: string
  idempotency_key: string
}

interface ApiReservationConfirmResponse {
  order_id: string
  status: string
  confirmed_at: string
  confirmed_seats?: Array<{
    id: string
    section: string
    row: string
    number: string
  }>
}

interface ApiReservationCancelRequest {
  reservation_id: string
  user_id: string
  reason?: string
  idempotency_key: string
}

interface ApiReservationCancelResponse {
  status: string
  cancelled_at: string
  released_seats?: Array<{
    id: string
    section: string
    row: string
    number: string
  }>
}

interface ApiReservationGetResponse {
  reservation: {
    reservation_id: string
    event_id: string
    user_id: string
    status: string
    seats: Array<{
      id: string
      section: string
      row: string
      number: string
    }>
    quantity: number
    total_amount?: {
      amount: number
      currency: string
    }
    created_at: string
    updated_at: string
    hold_expires_at?: string
    payment_intent_id?: string
    order_id?: string
  }
}

/**
 * 실제 reservation-api 서버와 통신하는 API 함수들
 */
export const realReservationApi = {
  /**
   * 예약을 생성합니다.
   */
  create: async (data: ReservationCreateRequest): Promise<ReservationCreateResponse> => {
    const apiPrefix = getApiPrefix()

    console.log('🎫 [RESERVATION API] Creating reservation with data:', data)

    const requestData: ApiReservationCreateRequest = {
      event_id: data.event_id,
      seat_ids: data.seat_ids,
      quantity: data.quantity,
      reservation_token: data.reservation_token,  // 🔑 입장 토큰 포함
      user_id: data.user_id,
    }

    console.log('📤 [RESERVATION API] Request payload:', requestData)

    const response = await postWithIdempotency<ApiReservationCreateResponse>(
      apiPrefix,
      requestData
    )

    console.log('✅ [RESERVATION API] Response:', response)

    return {
      reservation_id: response.reservation_id,
      hold_expires_at: response.hold_expires_at,
    }
  },

  /**
   * 예약을 확정합니다.
   */
  confirm: async (
    reservationId: string,
    data: ReservationConfirmRequest
  ): Promise<ReservationConfirmResponse> => {
    const apiPrefix = getApiPrefix()

    const requestData: ApiReservationConfirmRequest = {
      reservation_id: reservationId,
      user_id: 'current_user', // 실제로는 JWT에서 추출
      payment_intent_id: data.payment_intent_id,
      idempotency_key: Date.now().toString(),
    }

    const response = await apiClient.post<ApiReservationConfirmResponse>(
      `${apiPrefix}/${reservationId}/confirm`,
      requestData
    )

    return {
      order_id: response?.order_id || '',
      status: response?.status || 'FAILED',
    }
  },

  /**
   * 예약을 취소합니다.
   */
  cancel: async (reservationId: string): Promise<ReservationCancelResponse> => {
    const apiPrefix = getApiPrefix()

    const requestData: ApiReservationCancelRequest = {
      reservation_id: reservationId,
      user_id: 'current_user', // 실제로는 JWT에서 추출
      reason: 'USER_REQUESTED',
      idempotency_key: Date.now().toString(),
    }

    const response = await apiClient.post<ApiReservationCancelResponse>(
      `${apiPrefix}/${reservationId}/cancel`,
      requestData
    )

    return {
      status: response?.status || 'FAILED',
    }
  },

  /**
   * 예약 정보를 조회합니다.
   */
  get: async (reservationId: string) => {
    const apiPrefix = getApiPrefix()
    const response = await apiClient.get<ApiReservationGetResponse>(
      `${apiPrefix}/${reservationId}?user_id=current_user`
    )

    const reservation = response?.reservation!
    return {
      id: reservation.reservation_id,
      event_id: reservation.event_id,
      seat_ids: reservation.seats.map(seat => seat.id),
      quantity: reservation.quantity,
      reservation_token: '', // API에서 제공하지 않음
      user_id: reservation.user_id,
      hold_expires_at: reservation.hold_expires_at || null,
      status: reservation.status,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at,
      seats: reservation.seats,
      total_amount: reservation.total_amount,
    }
  },
}