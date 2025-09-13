import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, Users, Zap } from 'lucide-react'
import { queueApi } from '@/api/queue'
import { mockEvents } from '@/data/mockData'

function Landing() {
  const navigate = useNavigate()
  const [selectedEvent, setSelectedEvent] = useState('')

  const events = mockEvents.map(event => ({
    id: event.id,
    name: event.name,
    date: event.date,
  }))

  const joinQueueMutation = useMutation({
    mutationFn: (eventId: string) => queueApi.join({
      event_id: eventId,
      user_id: 'anonymous' // 임시 사용자 ID
    }),
    onSuccess: (data) => {
      // 대기열 토큰을 localStorage에 저장
      localStorage.setItem('waiting_token', data.waiting_token)
      navigate('/queue')
    },
    onError: (error) => {
      console.error('대기열 참여 실패:', error)
      alert('대기열 참여에 실패했습니다. 다시 시도해주세요.')
    },
  })

  const handleJoinQueue = () => {
    if (!selectedEvent) return
    joinQueueMutation.mutate(selectedEvent)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 히어로 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          빠르고 안정적인
          <br />
          <span className="text-primary-600">티켓 예매</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Traffic Tacos와 함께 특별한 순간을 예매하세요.
          대기열 시스템으로 공정한 예매 기회를 제공합니다.
        </p>
      </motion.div>

      {/* 특징 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
      >
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">빠른 예매</h3>
          <p className="text-sm text-gray-600">최적화된 시스템으로 빠른 티켓 예매</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-secondary-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">공정성 보장</h3>
          <p className="text-sm text-gray-600">대기열 시스템으로 공정한 기회 제공</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-accent-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">안정성</h3>
          <p className="text-sm text-gray-600">30k RPS 트래픽에도 안정적인 서비스</p>
        </div>
      </motion.div>

      {/* 이벤트 선택 및 대기열 참여 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="card max-w-md mx-auto"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          이벤트 선택
        </h2>

        <div className="space-y-4">
          <div>
            <label className="label">예매할 이벤트를 선택하세요</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="input"
            >
              <option value="">이벤트 선택</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} - {event.date}
                </option>
              ))}
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoinQueue}
            disabled={!selectedEvent || joinQueueMutation.isPending}
            className="btn btn-primary w-full"
          >
            {joinQueueMutation.isPending ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>참여 중...</span>
              </div>
            ) : (
              '대기열 입장하기'
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default Landing
