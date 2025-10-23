import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, Users, CheckCircle } from 'lucide-react'
import { queueApi } from '@/api/queue'
import { getApiMode } from '@/utils/config'
// import { usePolling } from '@/hooks/usePolling'

function Queue() {
  const navigate = useNavigate()
  const [waitingToken] = useState(() => localStorage.getItem('waiting_token') || '')
  const [isEntering, setIsEntering] = useState(false) // 중복 입장 방지
  const [totalWaiters, setTotalWaiters] = useState(() =>
    Math.floor(Math.random() * 51) + 250 // 초기값: 250~300
  )

  // API 모드 확인
  const apiMode = getApiMode()
  const isMockMode = apiMode === 'mock' || true // 임시: 강제 Mock 모드

  // 디버깅: 초기 상태 확인
  console.log('🎫 Waiting token:', waitingToken)
  console.log('🔧 API Mode:', apiMode, 'Mock:', isMockMode)
  console.log('🌍 Is Production:', import.meta.env.PROD)
  console.log('📄 Config loaded from:', getApiMode() === 'mock' ? 'Mock mode detected' : 'Not mock mode')

  // Mock 모드용 로컬 상태 관리
  const [mockQueueStatus, setMockQueueStatus] = useState<{
    status: 'waiting' | 'ready'
    position: number
    eta_sec?: number
    ready_for_entry?: boolean
    waiting_time?: number
  } | null>(() => {
    if (isMockMode && waitingToken) {
      // 초기 순번 설정 (빠른 테스트를 위해 낮게: 5~15)
      const initialPosition = Math.floor(Math.random() * 11) + 5
      return {
        status: 'waiting',
        position: initialPosition,
        eta_sec: Math.max(3, Math.floor(initialPosition * 0.8)), // 빠른 테스트용 ETA
        ready_for_entry: false,
        waiting_time: 0
      }
    }
    return null
  })

  // Mock 모드: 로컬에서 대기열 상태 관리
  useEffect(() => {
    if (!isMockMode || !waitingToken) return

    const interval = setInterval(() => {
      setMockQueueStatus(prev => {
        if (!prev || prev.status === 'ready') return prev

        const decreaseAmount = Math.floor(Math.random() * 4) + 3 // 3-6씩 감소 (더 빠름)
        const newPosition = Math.max(1, prev.position - decreaseAmount)

        if (newPosition <= 1) {
          return {
            status: 'ready' as const,
            position: 1,
            eta_sec: undefined,
            ready_for_entry: true,
            waiting_time: prev.waiting_time || 0
          }
        }

        const etaSec = Math.max(1, Math.floor(newPosition * 0.5)) // 빠른 테스트용 ETA

        return {
          status: 'waiting' as const,
          position: newPosition,
          eta_sec: etaSec,
          ready_for_entry: false,
          waiting_time: (prev.waiting_time || 0) + 2 // 2초마다 증가
        }
      })
    }, 2000) // 2초마다 업데이트

    return () => clearInterval(interval)
  }, [isMockMode, waitingToken])

  // 실제 API 모드용 쿼리
  const { data: realQueueStatus, error: statusError } = useQuery({
    queryKey: ['queue-status', waitingToken],
    queryFn: () => {
      console.log('🚨 REAL API CALLED - This should not happen in mock mode!')
      console.log('Token:', waitingToken, 'Mock mode:', isMockMode, 'API mode:', apiMode)
      return queueApi.getStatus(waitingToken)
    },
    enabled: !!waitingToken && !isMockMode, // Mock 모드가 아닐 때만 실행
    refetchInterval: 2000, // 2초마다 자동 갱신
    retry: 3, // 실패 시 3번 재시도
    retryDelay: 1000, // 1초 간격으로 재시도
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  // 현재 사용할 queueStatus 결정
  const queueStatus = isMockMode ? mockQueueStatus : realQueueStatus

  // 입장 뮤테이션
  const enterMutation = useMutation({
    mutationFn: () => queueApi.enter({ waiting_token: waitingToken }),
    onSuccess: (data) => {
      console.log('✅ [ENTER] Enter success, saving reservation token')
      
      // 🔑 SessionStorage에 토큰과 만료 시간 저장
      sessionStorage.setItem('reservation_token', data.reservation_token)
      sessionStorage.setItem(
        'reservation_expires_at', 
        String(Date.now() + (data.ttl_sec * 1000))
      )
      
      console.log('✅ [ENTER] Token saved with TTL:', data.ttl_sec, 'seconds')
      console.log('✅ [ENTER] Expires at:', new Date(Date.now() + data.ttl_sec * 1000).toISOString())
      
      // replace: true로 히스토리 교체 (뒤로가기 시 Landing으로 이동)
      navigate('/reserve', { replace: true })
    },
    onError: (error) => {
      console.error('❌ [LOAD TEST] Enter failed (continuing):', error)
      // 실패 시에만 플래그 해제 (성공 시 페이지 이동으로 자동 해제)
      setIsEntering(false)
      // 부하 테스트용: 에러 발생해도 알림 없이 계속 진행
      // alert 제거 - 사용자 플로우 중단하지 않음
    },
  })

  // 부하 테스트용: 에러 로깅만 하고 페이지는 유지
  if (statusError) {
    console.warn('⚠️ [LOAD TEST] Queue status error (page continues):', statusError)
  }

  // 전체 대기자 수를 2초마다 랜덤으로 업데이트 (250~300명)
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalWaiters(Math.floor(Math.random() * 51) + 250)
    }, 2000) // 2초마다 업데이트

    return () => clearInterval(interval)
  }, [])

  const status = queueStatus?.status || 'waiting'
  // 백엔드에서 받은 실제 position 값 사용 (PoC: 실제 대기열 데이터 반영)
  const position = queueStatus?.position ?? 0
  const etaSeconds = queueStatus?.eta_sec || 60

  // 디버깅: queueStatus 확인
  console.log('🔍 Queue status:', queueStatus)
  console.log('📊 Position:', position, 'ETA:', etaSeconds)

  const handleEnter = () => {
    if (!waitingToken) {
      console.warn('⚠️ [LOAD TEST] No waiting token, but attempting enter anyway')
      // 부하 테스트용: 토큰 없어도 시도 (fallback 토큰 사용)
      // alert 제거, navigate 제거
    }
    console.log('🔥 [LOAD TEST] User clicked enter button')
    enterMutation.mutate()
  }

  const handleLeave = async () => {
    if (!waitingToken) return
    
    console.log('🚪 [QUEUE] User clicked leave button')
    try {
      await queueApi.leave(waitingToken)
      localStorage.removeItem('waiting_token')
      console.log('✅ [QUEUE] Leave successful, navigating to home')
      navigate('/')
    } catch (error) {
      console.error('❌ [QUEUE] Leave failed:', error)
      // 실패해도 홈으로 이동
      localStorage.removeItem('waiting_token')
      navigate('/')
    }
  }

  // 🎯 자동 입장 로직: ready_for_entry=true 감지 시 자동 입장
  useEffect(() => {
    if (
      queueStatus?.ready_for_entry && 
      !isEntering && 
      status === 'waiting' &&
      !enterMutation.isPending
    ) {
      console.log('🚀 [AUTO ENTER] ready_for_entry detected! Auto-entering...')
      console.log('📊 [AUTO ENTER] Position:', queueStatus.position, 'Waiting time:', queueStatus.waiting_time)
      setIsEntering(true)
      handleEnter()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueStatus?.ready_for_entry, isEntering, status, enterMutation.isPending])

  // 🚪 브라우저 닫기/새로고침 시 대기열 이탈 처리
  useEffect(() => {
    if (!waitingToken) return

    const handleBeforeUnload = () => {
      console.log('🚪 [QUEUE] Browser closing/refreshing - attempting to leave queue')
      
      // Beacon API로 비동기 전송 (브라우저 종료 시에도 전송 보장)
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.traffictacos.store'
      const url = `${apiBase}/api/v1/queue/leave?token=${encodeURIComponent(waitingToken)}`
      
      try {
        // Beacon API는 POST만 지원하므로 DELETE 대신 POST 사용
        navigator.sendBeacon(url, JSON.stringify({ waiting_token: waitingToken }))
        console.log('✅ [QUEUE] Leave beacon sent')
      } catch (error) {
        console.warn('⚠️ [QUEUE] Leave beacon failed:', error)
      }

      // 사용자에게 확인 메시지 표시하려면 아래 주석 해제
      // e.preventDefault()
      // e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [waitingToken])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card text-center"
      >
        <div className="mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            대기열에 입장했어요
          </h1>
          <p className="text-gray-600">
            잠시만 기다려주세요. 곧 예매를 시작할 수 있습니다.
          </p>
        </div>

        {status === 'waiting' && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="space-y-6"
          >
            {/* 🎉 입장 준비 완료 배너 */}
            {queueStatus?.ready_for_entry && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border-2 border-green-500 rounded-lg p-4"
              >
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-900 font-semibold">
                    ✅ 입장 준비 완료! 자동으로 입장 중...
                  </span>
                </div>
                {isEntering && (
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full" />
                    </motion.div>
                    <span className="text-sm text-green-700">입장 처리 중...</span>
                  </div>
                )}
              </motion.div>
            )}

            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{position.toLocaleString()}</div>
                <div className="text-sm text-gray-500">내 순번</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-600">{formatTime(etaSeconds)}</div>
                <div className="text-sm text-gray-500">예상 대기시간</div>
              </div>
            </div>

            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className="bg-primary-500 h-3 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.max(10, (1 - position / 20000) * 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                전체 대기자: 약 {totalWaiters.toLocaleString()}명
              </div>
            </div>

            {/* 대기 상태 메시지 */}
            {!queueStatus?.ready_for_entry && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <Clock size={16} />
                <span>대기 중... (대기시간: {queueStatus?.waiting_time || 0}초)</span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                </motion.div>
              </div>
            )}

            {/* 대기열 나가기 버튼 */}
            <button
              onClick={handleLeave}
              className="btn btn-secondary w-full mt-4"
            >
              대기열 나가기
            </button>
          </motion.div>
        )}

        {status === 'ready' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                입장 준비 완료!
              </h2>
              <p className="text-gray-600">
                이제 예매를 시작할 수 있습니다.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEnter}
              disabled={enterMutation.isPending}
              className="btn btn-primary w-full text-lg py-4"
            >
              {enterMutation.isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>입장 중...</span>
                </div>
              ) : (
                '입장하기'
              )}
            </motion.button>
          </motion.div>
        )}

        {status === 'expired' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                대기열 시간이 만료되었어요
              </h2>
              <p className="text-gray-600">
                다시 대기열에 참여해주세요.
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary w-full"
            >
              처음으로 돌아가기
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default Queue
