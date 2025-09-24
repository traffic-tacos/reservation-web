import { useState } from 'react'
import { getConfig, getApiMode } from '@/utils/config'
import type { AppConfig } from '@/utils/config'

interface ApiModeToggleProps {
  className?: string
}

export function ApiModeToggle({ className }: ApiModeToggleProps) {
  const [currentMode] = useState<AppConfig['API_MODE']>(getApiMode())
  const [isLoading, setIsLoading] = useState(false)

  const switchToMode = async (mode: AppConfig['API_MODE']) => {
    setIsLoading(true)
    try {
      // 설정 파일을 동적으로 로드
      let configUrl = '/config.json'

      if (mode === 'local') {
        configUrl = '/config.local.json'
      } else if (mode === 'production') {
        configUrl = '/config.production.json'
      }

      // 새 설정 로드
      const response = await fetch(configUrl)
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`)
      }

      const newConfig = await response.json()

      // 캐시 클리어를 위해 강제 새로고침
      const currentConfig = {
        ...getConfig(),
        ...newConfig,
        API_MODE: mode,
      }

      // 로컬 스토리지에 설정 저장 (개발용)
      localStorage.setItem('dev_api_config', JSON.stringify(currentConfig))

      // 페이지 새로고침으로 설정 적용
      window.location.reload()
    } catch (error) {
      console.error('Failed to switch API mode:', error)
      alert(`모드 전환에 실패했습니다: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getModeDescription = (mode: AppConfig['API_MODE']) => {
    switch (mode) {
      case 'mock':
        return '더미 데이터'
      case 'local':
        return '로컬 서버 (localhost:8010)'
      case 'production':
        return '운영 서버 (api.traffictacos.store)'
      default:
        return '알 수 없음'
    }
  }

  const getModeColor = (mode: AppConfig['API_MODE']) => {
    switch (mode) {
      case 'mock':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'local':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'production':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  // 개발 모드에서만 표시
  if (getConfig().ENV === 'production') {
    return null
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border p-4 min-w-[280px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">API 모드</h3>
          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getModeColor(currentMode)}`}>
            {currentMode.toUpperCase()}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          현재: {getModeDescription(currentMode)}
        </p>

        <div className="space-y-2">
          <button
            onClick={() => switchToMode('mock')}
            disabled={isLoading || currentMode === 'mock'}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎭 Mock (더미 데이터)
          </button>

          <button
            onClick={() => switchToMode('local')}
            disabled={isLoading || currentMode === 'local'}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🏠 Local (localhost:8010)
          </button>

          <button
            onClick={() => switchToMode('production')}
            disabled={isLoading || currentMode === 'production'}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🚀 Production (Route53)
          </button>
        </div>

        {isLoading && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center text-sm text-gray-500">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              모드 변경 중...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}