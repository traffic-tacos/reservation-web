import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn } from 'lucide-react'
import { authApi, saveAuthData } from '@/api/auth'

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // 실제 로그인 API 호출
      const response = await authApi.login({ username, password })
      
      // 인증 정보 저장 (localStorage - 영구 보존)
      saveAuthData(response)

      console.log('✅ [LOGIN] Login success - user_id:', response.user_id)
      
      // 로그인 상태 변경 이벤트 발생
      window.dispatchEvent(new Event('auth-changed'))

      // 로그인 후 리다이렉트
      const redirectPath = localStorage.getItem('redirect_after_login') || '/queue'
      localStorage.removeItem('redirect_after_login')
      
      navigate(redirectPath)
    } catch (err) {
      console.error('❌ [LOGIN] Login failed:', err)
      const errorMessage = err instanceof Error ? err.message : '로그인에 실패했습니다. 다시 시도해주세요.'
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
            <label className="label">사용자명</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user01"
              className="input"
              required
              minLength={3}
              maxLength={20}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              테스트 계정: user01~user10 / pwd01~pwd10
            </p>
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
                <span>로그인 중...</span>
              </div>
            ) : (
              '로그인'
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <button
            onClick={() => navigate('/register')}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            계정이 없으신가요? 회원가입
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

export default Login

