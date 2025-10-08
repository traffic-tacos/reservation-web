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
    mutationFn: (eventId: string) => {
      console.log('🎯 Mutation starting - calling queueApi.join with:', { event_id: eventId, user_id: 'anonymous' })
      return queueApi.join({
        event_id: eventId,
        user_id: 'anonymous' // 임시 사용자 ID
      })
    },
    onSuccess: (data) => {
      console.log('✅ Mutation success - received data:', data)
      // 대기열 토큰을 localStorage에 저장
      localStorage.setItem('waiting_token', data.waiting_token)
      navigate('/queue')
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error)
      alert('대기열 참여에 실패했습니다. 다시 시도해주세요.')
    },
  })

  const handleJoinQueue = () => {
    if (!selectedEvent) return
    console.log('🚀 handleJoinQueue called with event:', selectedEvent)
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="card text-center cursor-pointer"
        >
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Zap className="w-6 h-6 text-primary-600" />
          </motion.div>
          <h3 className="font-semibold text-gray-900 mb-2">빠른 예매</h3>
          <p className="text-sm text-gray-600">최적화된 시스템으로 빠른 티켓 예매</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="card text-center cursor-pointer"
        >
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="w-12 h-12 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Users className="w-6 h-6 text-secondary-600" />
          </motion.div>
          <h3 className="font-semibold text-gray-900 mb-2">공정성 보장</h3>
          <p className="text-sm text-gray-600">대기열 시스템으로 공정한 기회 제공</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="card text-center cursor-pointer"
        >
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="w-12 h-12 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Calendar className="w-6 h-6 text-accent-600" />
          </motion.div>
          <h3 className="font-semibold text-gray-900 mb-2">안정성</h3>
          <p className="text-sm text-gray-600">30k RPS 트래픽에도 안정적인 서비스</p>
        </motion.div>
      </div>

      {/* 이벤트 선택 및 대기열 참여 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="card max-w-3xl mx-auto"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🎤 예매 가능한 공연
        </h2>

        <div className="space-y-4">
          {/* 이벤트 카드 목록 */}
          <div className="grid grid-cols-1 gap-4">
            {events.map((event) => (
              <motion.button
                key={event.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedEvent(event.id)}
                className={`
                  text-left p-4 rounded-xl border-2 transition-all duration-200
                  ${selectedEvent === event.id
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg mb-1 ${
                      selectedEvent === event.id ? 'text-primary-700' : 'text-gray-900'
                    }`}>
                      {event.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {event.date}
                    </p>
                  </div>
                  {selectedEvent === event.id && (
                    <div className="flex-shrink-0 ml-4">
                      <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* 대기열 입장 버튼 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoinQueue}
            disabled={!selectedEvent || joinQueueMutation.isPending}
            className="btn btn-primary w-full text-lg py-4 mt-6"
          >
            {joinQueueMutation.isPending ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>대기열 참여 중...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Users className="w-5 h-5" />
                <span>대기열 입장하기</span>
              </div>
            )}
          </motion.button>

          {selectedEvent && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-gray-500 text-center mt-2"
            >
              선택하신 공연의 대기열로 이동합니다
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default Landing
