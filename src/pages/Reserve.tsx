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
  const [holdTimeLeft, setHoldTimeLeft] = useState(180) // 3분 = 180초
  const [reservationToken] = useState(() => localStorage.getItem('reservation_token') || '')
  const [selectedFloor, setSelectedFloor] = useState<'1F' | '2F' | '3F' | '4F' | '5F' | '6F'>('1F')
  const [zoomLevel, setZoomLevel] = useState(1) // 확대/축소 레벨

  // 3분 카운트다운 타이머
  useEffect(() => {
    if (holdTimeLeft <= 0) {
      alert('예약 시간이 만료되었습니다. 처음부터 다시 시작해주세요.')
      navigate('/')
      return
    }

    const timer = setInterval(() => {
      setHoldTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [holdTimeLeft, navigate])

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
      alert('예약에 실패했습니다. 다시 시도해주세요.')
    },
  })

  // 예약하기 핸들러
  const handleReserve = async () => {
    console.log('🎫 [RESERVATION] Reserve button clicked')
    console.log('🎫 [RESERVATION] Selected seats:', selectedSeats)
    console.log('🎫 [RESERVATION] Quantity:', quantity)

    // JWT 토큰 확인 (게스트 토큰 제외)
    const authToken = localStorage.getItem('auth_token')
    if (!authToken) {
      console.warn('⚠️ [RESERVATION] No JWT token found - redirecting to login')
      alert('로그인이 필요한 서비스입니다.')
      navigate('/login')
      return
    }

    if (selectedSeats.length !== quantity) {
      alert(`${quantity}개의 좌석을 선택해주세요.`)
      return
    }

    const eventId = localStorage.getItem('selected_event_id') || 'evt_2025_1001'
    
    console.log('📡 [RESERVATION] Calling mutation with:', {
      event_id: eventId,
      seat_ids: selectedSeats,
      quantity
    })

    try {
      await createReservationMutation.mutateAsync({
        event_id: eventId,
        seat_ids: selectedSeats,
        quantity
      })
      console.log('✅ [RESERVATION] Mutation completed successfully')
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

  // 마우스 휠 줌 핸들러
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setZoomLevel(prev => {
          const delta = e.deltaY > 0 ? -0.1 : 0.1
          const newZoom = prev + delta
          return Math.max(0.5, Math.min(3, newZoom)) // 0.5x ~ 3x
        })
      }
    }

    const container = document.getElementById('seat-container')
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // 층별 좌석 배치 생성 (6층, 돔 형태 곡선)
  const generateFloorSeats = (floor: '1F' | '2F' | '3F' | '4F' | '5F' | '6F') => {
    const floorConfig = {
      '1F': { name: 'VIP석', color: 'purple', rows: 10, baseSeats: 30, prefix: 'VIP' },
      '2F': { name: 'R석', color: 'blue', rows: 12, baseSeats: 35, prefix: 'R' },
      '3F': { name: 'S석', color: 'green', rows: 15, baseSeats: 40, prefix: 'S' },
      '4F': { name: 'A석', color: 'orange', rows: 18, baseSeats: 45, prefix: 'A' },
      '5F': { name: 'B석', color: 'red', rows: 20, baseSeats: 50, prefix: 'B' },
      '6F': { name: 'C석', color: 'gray', rows: 25, baseSeats: 55, prefix: 'C' },
    }

    const config = floorConfig[floor]
    const seats = []

    for (let row = 1; row <= config.rows; row++) {
      // 돔 곡선 계산: 앞쪽(1행)은 좁고, 뒤쪽(마지막 행)은 넓음
      const curveFactor = 0.6 + (row / config.rows) * 0.4 // 0.6 ~ 1.0
      const seatsInRow = Math.floor(config.baseSeats * curveFactor)
      
      seats.push({
        row,
        count: seatsInRow,
        config
      })
    }

    return seats
  }

  const currentFloorSeats = generateFloorSeats(selectedFloor)
  const floorConfig = {
    '1F': { name: 'VIP석', color: 'purple', emoji: '💎', gradient: 'from-purple-500 to-purple-700' },
    '2F': { name: 'R석', color: 'blue', emoji: '🎫', gradient: 'from-blue-500 to-blue-700' },
    '3F': { name: 'S석', color: 'green', emoji: '🎟️', gradient: 'from-green-500 to-green-700' },
    '4F': { name: 'A석', color: 'orange', emoji: '🎪', gradient: 'from-orange-500 to-orange-700' },
    '5F': { name: 'B석', color: 'red', emoji: '🎭', gradient: 'from-red-500 to-red-700' },
    '6F': { name: 'C석', color: 'gray', emoji: '🎬', gradient: 'from-gray-500 to-gray-700' },
  }[selectedFloor]

  return (
    <div className="max-w-6xl mx-auto px-4">
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
          
          {/* 홀드 타이머 (3분 카운트다운) */}
          <div className={`border rounded-xl px-4 py-2 ${
            holdTimeLeft <= 30 
              ? 'bg-red-50 border-red-300' 
              : holdTimeLeft <= 60 
              ? 'bg-orange-50 border-orange-300' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className={`flex items-center space-x-2 ${
              holdTimeLeft <= 30 
                ? 'text-red-800' 
                : holdTimeLeft <= 60 
                ? 'text-orange-800' 
                : 'text-yellow-800'
            }`}>
              <Clock size={18} className={holdTimeLeft <= 30 ? 'animate-pulse' : ''} />
              <div className="text-right">
                <div className="font-bold text-lg">
                  {Math.floor(holdTimeLeft / 60)}:{(holdTimeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-xs opacity-80">남은 시간</div>
              </div>
            </div>
          </div>
        </div>

        {/* 수량 선택 */}
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
      </motion.div>

      {/* 층 선택 탭 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card mb-6"
      >
        <div className="grid grid-cols-3 gap-2">
          {(['1F', '2F', '3F', '4F', '5F', '6F'] as const).map((floor) => {
            const config = {
              '1F': { name: 'VIP석', emoji: '💎', color: 'purple' },
              '2F': { name: 'R석', emoji: '🎫', color: 'blue' },
              '3F': { name: 'S석', emoji: '🎟️', color: 'green' },
              '4F': { name: 'A석', emoji: '🎪', color: 'orange' },
              '5F': { name: 'B석', emoji: '🎭', color: 'red' },
              '6F': { name: 'C석', emoji: '🎬', color: 'gray' },
            }[floor]

            const isActive = selectedFloor === floor
            const colorClasses = {
              purple: isActive ? 'bg-purple-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-purple-100',
              blue: isActive ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-blue-100',
              green: isActive ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-green-100',
              orange: isActive ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-orange-100',
              red: isActive ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-red-100',
              gray: isActive ? 'bg-gray-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            }[config.color]

            return (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${colorClasses}`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">{config.emoji}</span>
                  <div className="text-left">
                    <div className="text-sm font-bold">{floor}</div>
                    <div className="text-xs opacity-80">{config.name}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* 좌석 배치도 (돔 형식) */}
      <motion.div
        key={selectedFloor}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="card"
      >
        {/* 스테이지 */}
        <div className="mb-8 text-center">
          <div className="relative">
            <div className={`bg-gradient-to-r ${floorConfig.gradient} text-white py-6 rounded-3xl shadow-2xl`}>
              <p className="text-2xl font-bold">🎤 STAGE 🎤</p>
              <p className="text-sm mt-1 opacity-80">{floorConfig.emoji} {floorConfig.name} - {selectedFloor}</p>
            </div>
            {/* 스테이지 조명 효과 */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3/4 h-8 bg-gradient-to-b from-yellow-200/50 to-transparent blur-xl"></div>
          </div>
        </div>

        {/* 줌 컨트롤 안내 */}
        <div className="mb-4 text-center">
          <p className="text-xs text-gray-500">
            💡 <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl</kbd> + 마우스 휠로 확대/축소 (현재: {Math.round(zoomLevel * 100)}%)
          </p>
        </div>

        {/* 좌석 그리드 (돔 곡선 형태 + 줌) */}
        <div 
          id="seat-container"
          className="max-h-[600px] overflow-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center top',
            transition: 'transform 0.2s ease-out'
          }}
        >
          <div className="space-y-3">
            {currentFloorSeats.map(({ row, count, config }) => {
              // 중앙 정렬을 위한 패딩 계산
              const maxSeats = config.baseSeats
              const paddingSeats = Math.floor((maxSeats - count) / 2)
              const seatSize = 20 // 좌석 크기 (20px)
              const seatGap = 4 // 좌석 간격 (4px)

              return (
                <div key={`${config.prefix}-${row}`} className="flex items-center justify-center space-x-2">
                  {/* 행 번호 */}
                  <span className="text-sm text-gray-600 w-14 text-right font-bold">
                    {row}행
                  </span>

                  {/* 좌측 패딩 */}
                  <div style={{ width: `${paddingSeats * (seatSize + seatGap)}px` }}></div>

                  {/* 좌석 버튼들 */}
                  <div className="flex gap-1">
                    {Array.from({ length: count }, (_, seatIdx) => {
                      const seatId = `${config.prefix}-${row}-${seatIdx + 1}`
                      const isSelected = selectedSeats.includes(seatId)
                      
                      const colorClasses = {
                        purple: isSelected ? 'bg-pink-500 ring-4 ring-pink-300 shadow-lg' : 'bg-purple-500 hover:bg-purple-600 hover:shadow-lg',
                        blue: isSelected ? 'bg-cyan-500 ring-4 ring-cyan-300 shadow-lg' : 'bg-blue-500 hover:bg-blue-600 hover:shadow-lg',
                        green: isSelected ? 'bg-lime-500 ring-4 ring-lime-300 shadow-lg' : 'bg-green-500 hover:bg-green-600 hover:shadow-lg',
                        orange: isSelected ? 'bg-yellow-500 ring-4 ring-yellow-300 shadow-lg' : 'bg-orange-500 hover:bg-orange-600 hover:shadow-lg',
                        red: isSelected ? 'bg-rose-500 ring-4 ring-rose-300 shadow-lg' : 'bg-red-500 hover:bg-red-600 hover:shadow-lg',
                        gray: isSelected ? 'bg-slate-500 ring-4 ring-slate-300 shadow-lg' : 'bg-gray-500 hover:bg-gray-600 hover:shadow-lg',
                      }[config.color]

                      return (
                        <button
                          key={seatId}
                          onClick={() => handleSeatClick(seatId)}
                          className={`rounded-full transition-all transform hover:scale-125 ${colorClasses}`}
                          style={{ width: `${seatSize}px`, height: `${seatSize}px` }}
                          title={seatId}
                        />
                      )
                    })}
                  </div>

                  {/* 우측 패딩 */}
                  <div style={{ width: `${paddingSeats * (seatSize + seatGap)}px` }}></div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 선택된 좌석 목록 */}
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
          >
            <p className="text-sm font-bold text-gray-900 mb-3">
              ✨ 선택된 좌석 ({selectedSeats.length}석)
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedSeats.map(seat => (
                <span
                  key={seat}
                  className="px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-medium rounded-lg shadow-md"
                >
                  {seat}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* 예약 버튼 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReserve}
          disabled={selectedSeats.length !== quantity || createReservationMutation.isPending}
          className="btn btn-primary w-full text-lg py-5 mt-6 shadow-xl"
        >
          {createReservationMutation.isPending ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>예약 처리 중...</span>
            </div>
          ) : (
            `🎫 예약하기 (${selectedSeats.length}/${quantity}석)`
          )}
        </motion.button>
      </motion.div>
    </div>
  )
}

export default Reserve
