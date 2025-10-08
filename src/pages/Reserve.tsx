import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Ticket, Clock } from 'lucide-react'
import { reservationApi } from '@/api/reservation'

function Reserve() {
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [holdTimeLeft] = useState(60)
  const [reservationToken] = useState(() => localStorage.getItem('reservation_token') || '')

  // 예약 생성 뮤테이션
  const createReservationMutation = useMutation({
    mutationFn: (data: { event_id: string; seat_ids: string[]; quantity: number }) => {
      console.log('🚀 [RESERVATION] mutationFn called with:', data)
      console.log('🔑 [RESERVATION] Using reservationToken:', reservationToken)
      
      const payload = {
        ...data,
        reservation_token: reservationToken || `rtkn_fallback_${Date.now()}`,
        user_id: 'user_' + Date.now(), // 임시 user_id
      }
      
      console.log('📤 [RESERVATION] Final payload:', payload)
      return reservationApi.create(payload)
    },
    onSuccess: (response) => {
      console.log('✅ [RESERVATION] Create success:', response)
      
      // 예약 ID 검증
      if (!response.reservation_id || response.reservation_id === '') {
        console.error('❌ [RESERVATION] Empty reservation_id received from backend')
        console.error('❌ [RESERVATION] Full response:', JSON.stringify(response, null, 2))
        alert('예약 생성에 실패했습니다. (reservation_id가 비어있음)\n\n백엔드 팀에 문의해주세요.')
        return
      }
      
      // 예약 ID 저장
      localStorage.setItem('reservation_id', response.reservation_id)
      localStorage.setItem('hold_expires_at', response.hold_expires_at)
      navigate('/payment')
    },
    onError: (error) => {
      console.error('❌ [RESERVATION] Create failed:', error)
      console.error('❌ [RESERVATION] Error details:', JSON.stringify(error, null, 2))
      console.error('❌ [RESERVATION] Error message:', (error as Error).message)
      console.error('❌ [RESERVATION] Error stack:', (error as Error).stack)
      
      // 사용자에게 에러 알림
      alert(`예약에 실패했습니다.\n\n${(error as Error).message || '다시 시도해주세요.'}`)
    },
  })

  const handleReserve = async () => {
    console.log('🎫 [RESERVATION] handleReserve called')
    console.log('📋 [RESERVATION] reservationToken:', reservationToken)
    console.log('📋 [RESERVATION] selectedSeats:', selectedSeats)
    console.log('📋 [RESERVATION] quantity:', quantity)
    console.log('📋 [RESERVATION] localStorage.reservation_token:', localStorage.getItem('reservation_token'))

      // 로그인 여부 확인 (Auth API JWT only)
      const jwtToken = localStorage.getItem('auth_token')
      
      console.log('🔑 [RESERVATION] JWT token exists:', !!jwtToken)

      // JWT 토큰 없으면 로그인 필요
      if (!jwtToken) {
        console.warn('⚠️ [RESERVATION] No auth token - login required')
        const shouldLogin = window.confirm(
          '예약을 위해 로그인이 필요합니다.\n로그인 페이지로 이동하시겠습니까?'
        )
        if (shouldLogin) {
          // 로그인 페이지로 이동 (현재 페이지 URL 저장)
          localStorage.setItem('redirect_after_login', window.location.pathname)
          navigate('/login')
        }
        return
      }

    // 예약 토큰 확인
    if (!reservationToken) {
      console.error('❌ [RESERVATION] No reservation token')
      alert('예약 토큰이 만료되었습니다. 대기열부터 다시 시작해주세요.')
      navigate('/queue')
      return
    }

    console.log('🎫 [RESERVATION] Creating reservation with token:', reservationToken)

    try {
      createReservationMutation.mutate({
        event_id: 'evt_2025_1001',
        seat_ids: selectedSeats,
        quantity,
      })
    } catch (error) {
      console.error('❌ [RESERVATION] Mutation error:', error)
    }
  }

  // 🚪 브라우저 닫기/새로고침 시 예약 토큰 만료 처리
  useEffect(() => {
    if (!reservationToken) return

    const handleBeforeUnload = () => {
      console.log('🚪 [RESERVE] Browser closing/refreshing - reservation token will expire')
      
      // TODO: 백엔드에 예약 취소 API 추가 시 구현
      // const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.traffictacos.store'
      // const url = `${apiBase}/api/v1/queue/cancel-reservation?token=${encodeURIComponent(reservationToken)}`
      // navigator.sendBeacon(url)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [reservationToken])

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            좌석 선택 및 예약
          </h1>
          <p className="text-gray-600">
            원하시는 좌석과 수량을 선택해주세요
          </p>
        </div>

        {/* 홀드 타이머 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center space-x-2 text-yellow-800">
            <Clock size={16} />
            <span className="font-medium">예약 유지 시간:</span>
            <span className="font-bold">{holdTimeLeft}초</span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
            <motion.div
              className="bg-yellow-500 h-2 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: `${(holdTimeLeft / 60) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="label">수량 선택</label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="input"
            >
              {[1, 2, 3, 4].map(num => (
                <option key={num} value={num}>{num}매</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">좌석 선택 (데모)</label>
            <div className="grid grid-cols-5 gap-2">
              {['A-1', 'A-2', 'A-3', 'A-4', 'A-5'].map(seat => (
                <button
                  key={seat}
                  onClick={() => {
                    if (selectedSeats.includes(seat)) {
                      setSelectedSeats(prev => prev.filter(s => s !== seat))
                    } else if (selectedSeats.length < quantity) {
                      setSelectedSeats(prev => [...prev, seat])
                    }
                  }}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    selectedSeats.includes(seat)
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {seat}
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReserve}
            disabled={selectedSeats.length !== quantity || createReservationMutation.isPending}
            className="btn btn-primary w-full text-lg py-4"
          >
            {createReservationMutation.isPending ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>예약 처리 중...</span>
              </div>
            ) : (
              `예약하기 (${selectedSeats.length}/${quantity})`
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default Reserve
