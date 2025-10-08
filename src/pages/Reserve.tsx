import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
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

  // 좌석 클릭 핸들러
  const handleSeatClick = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatId))
    } else if (selectedSeats.length < quantity) {
      setSelectedSeats(prev => [...prev, seatId])
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* 상단 정보 패널 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              좌석 선택 및 예약
            </h1>
            <p className="text-sm text-gray-600">
              총 10,000석 | 선택: {selectedSeats.length}/{quantity}
            </p>
          </div>
          
          {/* 홀드 타이머 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
            <div className="flex items-center space-x-2 text-yellow-800">
              <Clock size={16} />
              <span className="font-bold">{holdTimeLeft}초</span>
            </div>
          </div>
        </div>

        {/* 수량 선택 및 범례 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">수량:</label>
            <select
              value={quantity}
              onChange={(e) => {
                setQuantity(Number(e.target.value))
                setSelectedSeats([])
              }}
              className="input py-2 px-3 text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}매</option>
              ))}
            </select>
          </div>

          {/* 좌석 범례 */}
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>VIP석</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>R석</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>S석</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-primary-500 rounded"></div>
              <span>선택됨</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 좌석 배치도 (돔 형식) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        {/* 스테이지 */}
        <div className="mb-6 text-center">
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white py-4 rounded-2xl shadow-lg">
            <p className="text-sm font-bold">🎤 STAGE 🎤</p>
          </div>
        </div>

        {/* 좌석 그리드 (스크롤 가능) */}
        <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50">
          {/* VIP 구역 */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-purple-700 mb-2">💎 VIP석 (1-20행)</h3>
            <div className="space-y-1">
              {Array.from({ length: 20 }, (_, rowIdx) => (
                <div key={`vip-row-${rowIdx + 1}`} className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500 w-8">{rowIdx + 1}</span>
                  <div className="flex space-x-0.5">
                    {Array.from({ length: 50 }, (_, seatIdx) => {
                      const seatId = `VIP-${rowIdx + 1}-${seatIdx + 1}`
                      const isSelected = selectedSeats.includes(seatId)
                      return (
                        <button
                          key={seatId}
                          onClick={() => handleSeatClick(seatId)}
                          className={`w-3 h-3 rounded-sm transition-colors ${
                            isSelected
                              ? 'bg-primary-500'
                              : 'bg-purple-500 hover:bg-purple-600'
                          }`}
                          title={seatId}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* R석 구역 */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-blue-700 mb-2">🎫 R석 (21-60행)</h3>
            <div className="space-y-1">
              {Array.from({ length: 40 }, (_, rowIdx) => (
                <div key={`r-row-${rowIdx + 21}`} className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500 w-8">{rowIdx + 21}</span>
                  <div className="flex space-x-0.5">
                    {Array.from({ length: 100 }, (_, seatIdx) => {
                      const seatId = `R-${rowIdx + 21}-${seatIdx + 1}`
                      const isSelected = selectedSeats.includes(seatId)
                      return (
                        <button
                          key={seatId}
                          onClick={() => handleSeatClick(seatId)}
                          className={`w-2 h-2 rounded-sm transition-colors ${
                            isSelected
                              ? 'bg-primary-500'
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                          title={seatId}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* S석 구역 */}
          <div>
            <h3 className="text-sm font-bold text-green-700 mb-2">🎟️ S석 (61-110행)</h3>
            <div className="space-y-1">
              {Array.from({ length: 50 }, (_, rowIdx) => (
                <div key={`s-row-${rowIdx + 61}`} className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500 w-8">{rowIdx + 61}</span>
                  <div className="flex space-x-0.5">
                    {Array.from({ length: 100 }, (_, seatIdx) => {
                      const seatId = `S-${rowIdx + 61}-${seatIdx + 1}`
                      const isSelected = selectedSeats.includes(seatId)
                      return (
                        <button
                          key={seatId}
                          onClick={() => handleSeatClick(seatId)}
                          className={`w-2 h-2 rounded-sm transition-colors ${
                            isSelected
                              ? 'bg-primary-500'
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                          title={seatId}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 선택된 좌석 목록 */}
        {selectedSeats.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-sm font-medium text-blue-900 mb-2">
              선택된 좌석:
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedSeats.map(seat => (
                <span
                  key={seat}
                  className="px-2 py-1 bg-primary-500 text-white text-xs rounded-lg"
                >
                  {seat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 예약 버튼 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReserve}
          disabled={selectedSeats.length !== quantity || createReservationMutation.isPending}
          className="btn btn-primary w-full text-lg py-4 mt-6"
        >
          {createReservationMutation.isPending ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>예약 처리 중...</span>
            </div>
          ) : (
            `예약하기 (${selectedSeats.length}/${quantity}석)`
          )}
        </motion.button>
      </motion.div>
    </div>
  )
}

export default Reserve
