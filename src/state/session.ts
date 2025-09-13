import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 세션 상태 타입
interface SessionState {
  // 인증 관련
  authToken: string | null
  userId: string | null
  isAuthenticated: boolean

  // 대기열 관련
  waitingToken: string | null
  reservationToken: string | null

  // 예약 관련
  currentReservationId: string | null
  selectedEventId: string | null
  selectedSeats: string[]
  quantity: number

  // 액션들
  setAuthToken: (token: string | null) => void
  setUser: (userId: string | null) => void
  setWaitingToken: (token: string | null) => void
  setReservationToken: (token: string | null) => void
  setCurrentReservation: (reservationId: string | null) => void
  setEventSelection: (eventId: string | null, seats?: string[], quantity?: number) => void
  clearSession: () => void
  clearQueueState: () => void
}

// 기본 상태
const initialState = {
  authToken: null,
  userId: null,
  isAuthenticated: false,
  waitingToken: null,
  reservationToken: null,
  currentReservationId: null,
  selectedEventId: null,
  selectedSeats: [],
  quantity: 1,
}

// Zustand 스토어 생성 (persist 미들웨어로 localStorage에 영구 저장)
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,

      setAuthToken: (token) => {
        set({
          authToken: token,
          isAuthenticated: !!token,
        })
      },

      setUser: (userId) => {
        set({ userId })
      },

      setWaitingToken: (token) => {
        set({ waitingToken: token })
      },

      setReservationToken: (token) => {
        set({ reservationToken: token })
      },

      setCurrentReservation: (reservationId) => {
        set({ currentReservationId: reservationId })
      },

      setEventSelection: (eventId, seats = [], quantity = 1) => {
        set({
          selectedEventId: eventId,
          selectedSeats: seats,
          quantity,
        })
      },

      clearSession: () => {
        set(initialState)
      },

      clearQueueState: () => {
        set({
          waitingToken: null,
          reservationToken: null,
          currentReservationId: null,
        })
      },
    }),
    {
      name: 'traffic-tacos-session',
      // 민감한 데이터는 제외하고 저장
      partialize: (state) => ({
        userId: state.userId,
        selectedEventId: state.selectedEventId,
        selectedSeats: state.selectedSeats,
        quantity: state.quantity,
        // authToken은 제외 (메모리에만 유지)
      }),
    }
  )
)

// 편의 훅들
export const useAuth = () => {
  const { isAuthenticated, authToken, userId, setAuthToken, setUser } = useSessionStore()
  return {
    isAuthenticated,
    authToken,
    userId,
    setAuthToken,
    setUser,
  }
}

export const useQueue = () => {
  const { waitingToken, reservationToken, setWaitingToken, setReservationToken, clearQueueState } = useSessionStore()
  return {
    waitingToken,
    reservationToken,
    setWaitingToken,
    setReservationToken,
    clearQueueState,
  }
}

export const useReservation = () => {
  const {
    currentReservationId,
    selectedEventId,
    selectedSeats,
    quantity,
    setCurrentReservation,
    setEventSelection
  } = useSessionStore()

  return {
    currentReservationId,
    selectedEventId,
    selectedSeats,
    quantity,
    setCurrentReservation,
    setEventSelection,
  }
}
