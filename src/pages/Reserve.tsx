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
  const [initialZoom, setInitialZoom] = useState<number | null>(null) // 초기 줌 레벨 저장

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

  // 좌석 컨테이너 크기 계산 및 초기 줌 설정
  useEffect(() => {
    const calculateInitialZoom = () => {
      const container = document.getElementById('seat-container')
      const grid = document.getElementById('seat-grid')
      
      if (container && grid) {
        const containerWidth = container.clientWidth - 48 // padding 제외
        const gridWidth = grid.scrollWidth
        
        if (gridWidth > containerWidth) {
          const calculatedZoom = containerWidth / gridWidth
          const finalZoom = Math.max(0.5, Math.min(1, calculatedZoom)) // 0.5 ~ 1.0 범위
          
          console.log('📐 [ZOOM] Container:', containerWidth, 'Grid:', gridWidth, 'Calculated:', finalZoom)
          
          // 초기 줌이 설정되지 않았을 때만 설정
          if (initialZoom === null) {
            setInitialZoom(finalZoom)
            setZoomLevel(finalZoom)
          }
        }
      }
    }

    // 약간의 지연 후 계산 (렌더링 완료 대기)
    const timer = setTimeout(calculateInitialZoom, 100)
    return () => clearTimeout(timer)
  }, [selectedFloor, initialZoom])

  // 마우스 휠 줌 핸들러
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setZoomLevel(prev => {
          const delta = e.deltaY > 0 ? -0.1 : 0.1
          const newZoom = prev + delta
          return Math.max(0.3, Math.min(3, newZoom)) // 0.3x ~ 3x
        })
      }
    }

    const container = document.getElementById('seat-container')
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // 층별 좌석 배치 생성 (6층, 돔 형태 곡선 + 가로 통로 2줄)
  // 총 10,000석 목표: 각 층별 좌석 수 계산됨
  const generateFloorSeats = (floor: '1F' | '2F' | '3F' | '4F' | '5F' | '6F') => {
    const floorConfig = {
      '1F': { name: 'VIP석', color: 'purple', rows: 20, baseSeats: 90, prefix: 'VIP', aisleRows: [6, 7, 14, 15] },
      '2F': { name: 'R석', color: 'blue', rows: 22, baseSeats: 100, prefix: 'R', aisleRows: [7, 8, 15, 16] },
      '3F': { name: 'S석', color: 'green', rows: 25, baseSeats: 110, prefix: 'S', aisleRows: [8, 9, 17, 18] },
      '4F': { name: 'A석', color: 'orange', rows: 28, baseSeats: 120, prefix: 'A', aisleRows: [9, 10, 19, 20] },
      '5F': { name: 'B석', color: 'red', rows: 30, baseSeats: 130, prefix: 'B', aisleRows: [10, 11, 20, 21] },
      '6F': { name: 'C석', color: 'gray', rows: 35, baseSeats: 140, prefix: 'C', aisleRows: [11, 12, 23, 24] },
    }

    const config = floorConfig[floor]
    const seats = []

    for (let row = 1; row <= config.rows; row++) {
      // 돔 곡선 계산: 앞쪽(1행)은 좁고, 뒤쪽(마지막 행)은 넓음
      const curveFactor = 0.6 + (row / config.rows) * 0.4 // 0.6 ~ 1.0
      const seatsInRow = Math.floor(config.baseSeats * curveFactor)
      
      // 통로 여부 확인
      const isAisle = config.aisleRows.includes(row)
      
      seats.push({
        row,
        count: seatsInRow,
        config,
        isAisle
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
              '1F': { name: 'VIP석', emoji: '💎', color: 'purple', prefix: 'VIP' },
              '2F': { name: 'R석', emoji: '🎫', color: 'blue', prefix: 'R' },
              '3F': { name: 'S석', emoji: '🎟️', color: 'green', prefix: 'S' },
              '4F': { name: 'A석', emoji: '🎪', color: 'orange', prefix: 'A' },
              '5F': { name: 'B석', emoji: '🎭', color: 'red', prefix: 'B' },
              '6F': { name: 'C석', emoji: '🎬', color: 'gray', prefix: 'C' },
            }[floor]

            // 해당 층에서 선택된 좌석 개수 계산
            const seatsInFloor = selectedSeats.filter(seat => seat.startsWith(config.prefix)).length

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
                className={`relative py-3 px-4 rounded-xl font-medium transition-all ${colorClasses}`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">{config.emoji}</span>
                  <div className="text-left">
                    <div className="text-sm font-bold">{floor}</div>
                    <div className="text-xs opacity-80">{config.name}</div>
                  </div>
                </div>
                {/* 선택된 좌석 개수 배지 */}
                {seatsInFloor > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                    {seatsInFloor}
                  </div>
                )}
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
        <div className="mb-8">
          <div className="relative">
            {/* 스테이지 배경 */}
            <div className={`bg-gradient-to-r ${floorConfig.gradient} text-white rounded-3xl shadow-2xl overflow-hidden`}>
              {/* 스테이지 장비 및 조명 */}
              <div className="relative h-32 flex items-center justify-center">
                {/* 조명 트러스 */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gray-800"></div>
                <div className="absolute top-2 left-10 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                <div className="absolute top-2 left-1/4 w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="absolute top-2 left-1/2 w-3 h-3 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                <div className="absolute top-2 left-3/4 w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }}></div>
                <div className="absolute top-2 right-10 w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1.2s' }}></div>
                
                {/* 메인 스테이지 */}
                <div className="z-10 text-center">
                  <p className="text-3xl font-bold mb-2">🎤 STAGE 🎤</p>
                  <p className="text-sm opacity-90">{floorConfig.emoji} {floorConfig.name} - {selectedFloor}</p>
                </div>

                {/* 스피커 */}
                <div className="absolute bottom-4 left-8">
                  <div className="w-6 h-12 bg-gray-800 rounded border border-gray-600 flex flex-col justify-around p-1">
                    <div className="w-full h-2 bg-gray-700 rounded-full"></div>
                    <div className="w-full h-2 bg-gray-700 rounded-full"></div>
                    <div className="w-full h-2 bg-gray-700 rounded-full"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 right-8">
                  <div className="w-6 h-12 bg-gray-800 rounded border border-gray-600 flex flex-col justify-around p-1">
                    <div className="w-full h-2 bg-gray-700 rounded-full"></div>
                    <div className="w-full h-2 bg-gray-700 rounded-full"></div>
                    <div className="w-full h-2 bg-gray-700 rounded-full"></div>
                  </div>
                </div>

                {/* 모니터 */}
                <div className="absolute bottom-2 left-1/3 w-8 h-4 bg-gray-700 border border-gray-500 transform -rotate-12"></div>
                <div className="absolute bottom-2 right-1/3 w-8 h-4 bg-gray-700 border border-gray-500 transform rotate-12"></div>
              </div>
            </div>
            {/* 스테이지 조명 효과 */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-3/4 h-12 bg-gradient-to-b from-yellow-200/50 to-transparent blur-xl"></div>
          </div>
        </div>

        {/* 줌 컨트롤 안내 */}
        <div className="mb-4 text-center">
          <p className="text-xs text-gray-500">
            💡 <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl</kbd> + 마우스 휠로 확대/축소 (현재: {Math.round(zoomLevel * 100)}%)
          </p>
        </div>

        {/* 좌석 그리드 컨테이너 (스크롤 영역) */}
        <div 
          id="seat-container"
          className="max-h-[600px] overflow-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl"
        >
          {/* 좌석 그리드 (줌 적용 영역) */}
          <div 
            id="seat-grid"
            className="space-y-3"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center top',
              transition: 'transform 0.2s ease-out'
            }}
          >
            {currentFloorSeats.map(({ row, count, config, isAisle }) => {
              // 통로인 경우 통로 표시
              if (isAisle) {
                return (
                  <div key={`${config.prefix}-aisle-${row}`} className="flex items-center justify-center py-2">
                    <div className="w-full border-t-2 border-dashed border-gray-400 relative">
                      <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-100 px-3 py-1 text-xs text-gray-500 font-medium rounded-full">
                        🚶 통로 {row}
                      </span>
                    </div>
                  </div>
                )
              }

              // 좌석을 3x3 그리드로 9등분 (정사각형 배치)
              const seatSize = 20 // 좌석 크기 (20px)
              const aisleGap = 24 // 통로 간격 (24px)
              
              // 9등분: 각 블록당 좌석 수
              const seatsPerBlock = Math.floor(count / 9)
              const blocks = [
                seatsPerBlock, seatsPerBlock, seatsPerBlock, // 좌측 3블록
                seatsPerBlock, seatsPerBlock, seatsPerBlock, // 중앙 3블록
                seatsPerBlock, seatsPerBlock, count - (seatsPerBlock * 8) // 우측 3블록 (마지막에 나머지)
              ]

              const renderSeatBlock = (start: number, length: number) => {
                return Array.from({ length }, (_, idx) => {
                  const seatId = `${config.prefix}-${row}-${start + idx + 1}`
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
                      className={`rounded-lg transition-all transform hover:scale-125 ${colorClasses}`}
                      style={{ width: `${seatSize}px`, height: `${seatSize}px` }}
                      title={seatId}
                    />
                  )
                })
              }

              let seatOffset = 0

              return (
                <div key={`${config.prefix}-${row}`} className="flex items-center justify-center gap-2">
                  {/* 행 번호 */}
                  <span className="text-sm text-gray-600 w-14 text-right font-bold">
                    {row}행
                  </span>

                  {/* 좌측 3블록 */}
                  <div className="flex gap-1">
                    {renderSeatBlock(seatOffset, blocks[0])}
                  </div>
                  <div className="flex gap-1">
                    {renderSeatBlock(seatOffset += blocks[0], blocks[1])}
                  </div>
                  <div className="flex gap-1">
                    {renderSeatBlock(seatOffset += blocks[1], blocks[2])}
                  </div>

                  {/* 세로 통로 1 (좌측-중앙 사이) */}
                  <div style={{ width: `${aisleGap}px` }} className="h-5 flex items-center justify-center">
                    <div className="w-1 h-full bg-gray-400"></div>
                  </div>

                  {/* 중앙 3블록 */}
                  <div className="flex gap-1">
                    {renderSeatBlock(seatOffset += blocks[2], blocks[3])}
                  </div>
                  <div className="flex gap-1">
                    {renderSeatBlock(seatOffset += blocks[3], blocks[4])}
                  </div>
                  <div className="flex gap-1">
                    {renderSeatBlock(seatOffset += blocks[4], blocks[5])}
                  </div>

                  {/* 세로 통로 2 (중앙-우측 사이) */}
                  <div style={{ width: `${aisleGap}px` }} className="h-5 flex items-center justify-center">
                    <div className="w-1 h-full bg-gray-400"></div>
                  </div>

                  {/* 우측 3블록 */}
                  <div className="flex gap-1">
                    {renderSeatBlock(seatOffset += blocks[5], blocks[6])}
                  </div>
                  <div className="flex gap-1">
                    {renderSeatBlock(seatOffset += blocks[6], blocks[7])}
                  </div>
                  <div className="flex gap-1">
                    {renderSeatBlock(seatOffset += blocks[7], blocks[8])}
                  </div>
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
                <div
                  key={seat}
                  className="group relative px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  <span>{seat}</span>
                  {/* X 버튼 (호버 시 표시) */}
                  <button
                    onClick={() => {
                      setSelectedSeats(prev => prev.filter(s => s !== seat))
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    title="선택 취소"
                  >
                    <span className="text-xs leading-none">×</span>
                  </button>
                </div>
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
