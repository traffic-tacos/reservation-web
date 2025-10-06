import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn } from 'lucide-react'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: 실제 로그인 API 호출
      // const response = await authApi.login({ email, password })
      
      // 임시: 개발용 JWT 토큰 생성
      const devToken = `dev-jwt-${Date.now()}-${email.split('@')[0]}`
      localStorage.setItem('auth_token', devToken)
      localStorage.setItem('user_email', email)

      console.log('✅ [LOGIN] Login success:', devToken)

      // 로그인 후 리다이렉트
      const redirectPath = localStorage.getItem('redirect_after_login') || '/queue'
      localStorage.removeItem('redirect_after_login')
      
      navigate(redirectPath)
    } catch (error) {
      console.error('❌ [LOGIN] Login failed:', error)
      alert('로그인에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = () => {
    // 게스트 로그인 (임시 토큰)
    const guestToken = `guest-${Date.now()}`
    localStorage.setItem('auth_token', guestToken)
    localStorage.setItem('user_email', 'guest@traffictacos.store')

    console.log('✅ [LOGIN] Guest login success:', guestToken)

    const redirectPath = localStorage.getItem('redirect_after_login') || '/queue'
    localStorage.removeItem('redirect_after_login')
    
    navigate(redirectPath)
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
            <LogIn className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            로그인
          </h1>
          <p className="text-gray-600">
            예약을 위해 로그인이 필요합니다
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="label">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="input"
              required
            />
          </div>

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
                <span>로그인 중...</span>
              </div>
            ) : (
              '로그인'
            )}
          </motion.button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGuestLogin}
            className="btn btn-secondary w-full mt-6"
          >
            게스트로 계속하기
          </motion.button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            홈으로 돌아가기
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default Login

