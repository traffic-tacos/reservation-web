// 더미 데이터 모음
export interface MockEvent {
  id: string
  name: string
  date: string
  description: string
  availableSeats: number
  totalSeats: number
}

export interface MockReservation {
  id: string
  eventId: string
  userId: string
  seatIds: string[]
  quantity: number
  status: 'HOLD' | 'CONFIRMED' | 'CANCELLED'
  holdExpiresAt: string
  createdAt: string
}

export interface MockQueueStatus {
  status: 'waiting' | 'ready' | 'expired'
  position: number
  etaSeconds: number
  totalWaiting: number
}

// 이벤트 더미 데이터 (날짜 순서대로 정렬)
export const mockEvents: MockEvent[] = [
  {
    id: 'evt_2025_1004',
    name: 'BLACKPINK WORLD TOUR [BORN PINK] FINALE',
    date: '2025-11-08 (토) 19:30',
    description: '블랙핑크 월드투어 파이널 - 서울 잠실종합운동장 주경기장',
    availableSeats: 12000,
    totalSeats: 15000,
  },
  {
    id: 'evt_2025_1001',
    name: 'IU 2025 CONCERT [THE GOLDEN HOUR : ENCORE]',
    date: '2025-11-15 (토) 19:00',
    description: '아이유 월드투어 앵콜 콘서트 - 서울 잠실올림픽주경기장',
    availableSeats: 8500,
    totalSeats: 10000,
  },
  {
    id: 'evt_2025_1005',
    name: '임영웅 콘서트 [IM HERO] 2025',
    date: '2025-11-16 (일) 18:00',
    description: '임영웅 전국투어 서울 공연 - 고척스카이돔',
    availableSeats: 14500,
    totalSeats: 16000,
  },
  {
    id: 'evt_2025_1002',
    name: 'BTS REUNION WORLD TOUR - SEOUL',
    date: '2025-11-23 (일) 18:00',
    description: '방탄소년단 재결합 월드투어 서울 공연 - 잠실종합운동장 주경기장',
    availableSeats: 7200,
    totalSeats: 8000,
  },
]

// 대기열 상태 더미 데이터
export const mockQueueStatus: MockQueueStatus = {
  status: 'waiting',
  position: 12345,
  etaSeconds: 120,
  totalWaiting: 20000,
}

// 예약 더미 데이터
export const mockReservations: MockReservation[] = [
  {
    id: 'rsv_abc123',
    eventId: 'evt_2025_1001',
    userId: 'u123',
    seatIds: ['A-1', 'A-2'],
    quantity: 2,
    status: 'HOLD',
    holdExpiresAt: '2025-01-01T12:05:00Z',
    createdAt: '2025-01-01T12:00:00Z',
  },
]

// 좌석 레이아웃 더미 데이터
export const mockSeats = {
  sections: [
    { id: 'A', name: 'VIP석', rows: 10, seatsPerRow: 20 },
    { id: 'B', name: 'R석', rows: 15, seatsPerRow: 25 },
    { id: 'C', name: 'S석', rows: 20, seatsPerRow: 30 },
  ],
  getAvailableSeats: (sectionId: string) => {
    const section = mockSeats.sections.find(s => s.id === sectionId)
    if (!section) return []

    const seats = []
    for (let row = 1; row <= section.rows; row++) {
      for (let seat = 1; seat <= section.seatsPerRow; seat++) {
        // 랜덤하게 일부 좌석을 사용 가능으로 설정
        if (Math.random() > 0.3) {
          seats.push(`${section.id}-${row}-${seat}`)
        }
      }
    }
    return seats
  },
}

// API 응답 시뮬레이션 함수들
export const mockApiDelay = (ms: number = 1000) =>
  new Promise(resolve => setTimeout(resolve, ms))

export const mockRandomDelay = () =>
  mockApiDelay(Math.random() * 2000 + 500) // 500-2500ms 랜덤 딜레이

// 성공/실패 시뮬레이션
export const mockRandomSuccess = (successRate: number = 0.9) =>
  Math.random() < successRate

// 에러 타입들
export const mockErrors = {
  RATE_LIMITED: { code: 'RATE_LIMITED', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
  IDEMPOTENCY_CONFLICT: { code: 'IDEMPOTENCY_CONFLICT', message: '이미 처리된 요청입니다.' },
  RESERVATION_EXPIRED: { code: 'RESERVATION_EXPIRED', message: '예약 시간이 만료되었습니다.' },
  INVENTORY_CONFLICT: { code: 'INVENTORY_CONFLICT', message: '선택하신 좌석이 이미 예약되었습니다.' },
  UNAUTHENTICATED: { code: 'UNAUTHENTICATED', message: '인증이 필요합니다.' },
}
