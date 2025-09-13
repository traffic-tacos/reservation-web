import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'

// 간단한 토스트 타입
interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

// 임시 토스트 상태 (실제로는 전역 상태 관리 필요)
const toasts: Toast[] = []

function ToastContainer() {
  // 실제 구현에서는 useToast 훅이나 Zustand를 사용해야 함
  useEffect(() => {
    // 임시: 실제 토스트 로직은 추후 구현
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`flex items-center p-4 rounded-2xl shadow-card max-w-sm ${
              toast.type === 'success' ? 'bg-green-50 border border-green-200' :
              toast.type === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}
          >
            <div className="flex-1 text-sm">
              {toast.message}
            </div>
            <button className="ml-4 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ToastContainer
