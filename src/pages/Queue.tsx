import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, Users, CheckCircle } from 'lucide-react'
import { queueApi } from '@/api/queue'
// import { usePolling } from '@/hooks/usePolling'

function Queue() {
  const navigate = useNavigate()
  const [waitingToken] = useState(() => localStorage.getItem('waiting_token') || '')

  // 대기열 상태 조회 쿼리
  const { data: queueStatus } = useQuery({
    queryKey: ['queue-status', waitingToken],
    queryFn: () => queueApi.getStatus(waitingToken),
    enabled: !!waitingToken,
    refetchInterval: 2000, // 2초마다 자동 갱신
  })

  // 입장 뮤테이션
  const enterMutation = useMutation({
    mutationFn: () => queueApi.enter({ waiting_token: waitingToken }),
    onSuccess: (data) => {
      // 예약 토큰 저장
      localStorage.setItem('reservation_token', data.reservation_token)
      navigate('/reserve')
    },
    onError: (error) => {
      console.error('입장 실패:', error)
      alert('입장에 실패했습니다. 다시 시도해주세요.')
    },
  })

  const status = queueStatus?.status || 'waiting'
  const position = queueStatus ? Math.max(1, 20000 - (queueStatus.callCount || 0) * 5000) : 20000
  const etaSeconds = queueStatus?.eta_sec || 120

  const handleEnter = () => {
    if (!waitingToken) {
      alert('대기열 토큰이 없습니다. 처음부터 다시 시작해주세요.')
      navigate('/')
      return
    }
    enterMutation.mutate()
  }

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
                전체 대기자: 약 20,000명
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>대기 중...</span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
              </motion.div>
            </div>
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
