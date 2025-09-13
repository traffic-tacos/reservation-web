import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Share2, RotateCcw } from 'lucide-react'

function Confirm() {
  const navigate = useNavigate()

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '티켓 예매 완료',
        text: 'Traffic Tacos에서 티켓을 성공적으로 예매했습니다!',
        url: window.location.href,
      })
    } else {
      // 클립보드 복사 로직
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card text-center"
      >
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            예매 완료!
          </h1>
          <p className="text-gray-600">
            티켓 예매가 성공적으로 완료되었습니다.
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">주문번호</span>
              <span className="font-medium">ORD-2025-001234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">이벤트</span>
              <span className="font-medium">콘서트 A</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">좌석</span>
              <span className="font-medium">A-1, A-2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">수량</span>
              <span className="font-medium">2매</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-4">
              <span className="text-gray-600">총 금액</span>
              <span className="font-bold text-primary-600">120,000원</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleShare}
            className="btn btn-secondary w-full"
          >
            <Share2 className="w-4 h-4 mr-2" />
            공유하기
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="btn btn-primary w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            다시 예매하기
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default Confirm
