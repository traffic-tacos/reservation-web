import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard } from 'lucide-react'

function Payment() {
  const navigate = useNavigate()
  const [scenario, setScenario] = useState<'approve' | 'fail' | 'delay'>('approve')
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      // TODO: 결제 API 호출
      // const response = await paymentApi.create({
      //   reservation_id: 'rsv_abc123',
      //   amount: 120000,
      //   scenario
      // })

      // 임시: 성공 가정
      setTimeout(() => {
        navigate('/confirm')
      }, 2000)
    } catch (error) {
      console.error('결제 실패:', error)
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            결제 정보
          </h1>
          <p className="text-gray-600">
            결제 시뮬레이션 모드를 선택해주세요
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="label">시뮬레이션 시나리오</label>
            <div className="space-y-2">
              {[
                { value: 'approve', label: '승인 (성공)', desc: '결제가 정상적으로 승인됩니다' },
                { value: 'fail', label: '실패', desc: '결제가 실패합니다' },
                { value: 'delay', label: '지연', desc: '결제가 지연됩니다' },
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 hover:border-primary-300 cursor-pointer">
                  <input
                    type="radio"
                    name="scenario"
                    value={option.value}
                    checked={scenario === option.value}
                    onChange={(e) => setScenario(e.target.value as typeof scenario)}
                    className="text-primary-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">티켓 금액</span>
              <span className="font-medium">120,000원</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold">
              <span>총 결제금액</span>
              <span className="text-primary-600">120,000원</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePayment}
            disabled={isProcessing}
            className="btn btn-primary w-full text-lg py-4"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>결제 처리 중...</span>
              </div>
            ) : (
              '결제하기'
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default Payment
