import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CreditCard } from 'lucide-react'
import { paymentApi } from '@/api/payment'

function Payment() {
  const navigate = useNavigate()
  const [scenario, setScenario] = useState<'approve' | 'fail' | 'delay'>('approve')
  const [reservationId] = useState(() => localStorage.getItem('reservation_id') || '')

  // 결제 인텐트 생성 뮤테이션
  const createPaymentMutation = useMutation({
    mutationFn: (data: { reservation_id: string; amount: number; scenario: 'approve' | 'fail' | 'delay' }) =>
      paymentApi.createIntent({
        ...data,
        currency: 'KRW',
      }),
    onSuccess: (response) => {
      console.log('✅ [PAYMENT] Payment intent created:', response)
      // payment_intent_id 저장
      localStorage.setItem('payment_intent_id', response.payment_intent_id)
      
      // 시나리오에 따른 처리
      if (scenario === 'delay') {
        console.log('⏳ [PAYMENT] Delay scenario - waiting for webhook...')
        // 지연 시나리오: 웹훅 대기 시뮬레이션
        setTimeout(() => {
          navigate('/confirm')
        }, 5000) // 5초 대기
      } else if (scenario === 'fail') {
        console.log('❌ [PAYMENT] Fail scenario - showing error')
        alert('결제가 실패했습니다. 다시 시도해주세요.')
      } else {
        // approve: 즉시 확정 페이지로
        navigate('/confirm')
      }
    },
    onError: (error) => {
      console.error('❌ [PAYMENT] Payment intent creation failed:', error)
      alert('결제 처리에 실패했습니다. 다시 시도해주세요.')
    },
  })

  const handlePayment = async () => {
    if (!reservationId) {
      console.error('❌ No reservation ID')
      alert('예약 정보가 없습니다. 처음부터 다시 시작해주세요.')
      navigate('/')
      return
    }

    console.log('💳 [PAYMENT] Starting payment process:', {
      reservation_id: reservationId,
      amount: 120000,
      scenario,
    })

    createPaymentMutation.mutate({
      reservation_id: reservationId,
      amount: 120000,
      scenario,
    })
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
            disabled={createPaymentMutation.isPending}
            className="btn btn-primary w-full text-lg py-4"
          >
            {createPaymentMutation.isPending ? (
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
