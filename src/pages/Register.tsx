import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { authApi, saveAuthData } from '@/api/auth'

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    display_name: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // 실제 회원가입 API 호출
      const response = await authApi.register(formData)
      
      // 인증 정보 저장 (회원가입 후 자동 로그인)
      saveAuthData(response)

      console.log('✅ [REGISTER] Register success - user_id:', response.user_id)
      
      // 로그인 상태 변경 이벤트 발생
      window.dispatchEvent(new Event('auth-changed'))

      // 회원가입 후 리다이렉트
      const redirectPath = localStorage.getItem('redirect_after_login') || '/queue'
      localStorage.removeItem('redirect_after_login')
      
      navigate(redirectPath)
    } catch (err) {
      console.error('❌ [REGISTER] Register failed:', err)
      const errorMessage = err instanceof Error ? err.message : '회원가입에 실패했습니다. 다시 시도해주세요.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            회원가입
          </h1>
          <p className="text-gray-600">
            Traffic Tacos에 오신 것을 환영합니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">
              사용자명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="3-20자, 영문과 숫자만 사용"
              className="input"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9]+"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              로그인 시 사용할 사용자명입니다.
            </p>
          </div>

          <div>
            <label className="label">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="비밀번호를 입력하세요"
              className="input"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              백엔드 정책에 따라 검증됩니다 (권장: 6자 이상)
            </p>
          </div>

          <div>
            <label className="label">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@email.com"
              className="input"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="label">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="화면에 표시될 이름"
              className="input"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full text-lg py-4"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>회원가입 중...</span>
              </div>
            ) : (
              '회원가입'
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            이미 계정이 있으신가요? 로그인
          </button>
          <div>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Register

