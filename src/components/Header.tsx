import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ApiModeToggle } from './dev/ApiModeToggle'

function Header() {
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

          {/* 로그인/프로필 버튼 - 추후 구현 */}
          <div className="flex items-center space-x-4">
            {/* API 모드 토글 (개발 환경에서만) */}
            <ApiModeToggle variant="inline" />

            <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              로그인
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
