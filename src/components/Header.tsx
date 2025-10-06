import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { LogIn, LogOut, User } from 'lucide-react'
import { ApiModeToggle } from './dev/ApiModeToggle'

function Header() {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = () => {
      const email = localStorage.getItem('user_email') || sessionStorage.getItem('user_email')
      setUserEmail(email)
    }

    checkAuth()
    // storage 이벤트 리스너 (다른 탭에서 로그인 시)
    window.addEventListener('storage', checkAuth)
    // 커스텀 이벤트 리스너 (같은 탭에서 로그인 시)
    window.addEventListener('auth-changed', checkAuth)

    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('auth-changed', checkAuth)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_email')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('user_email')
    setUserEmail(null)
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/')
  }

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
            </motion.div>
            <span className="text-xl font-bold text-gray-900">Traffic Tacos</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {/* 추가 네비게이션 메뉴가 필요하면 여기에 추가 */}
          </nav>

          <div className="flex items-center space-x-4">
            {/* API 모드 토글 (개발 환경에서만) */}
            <ApiModeToggle variant="inline" />

            {/* 로그인/로그아웃 버튼 */}
            {userEmail ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User size={16} />
                  <span>{userEmail}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <LogOut size={16} />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogIn size={16} />
                <span>로그인</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
