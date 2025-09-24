import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy, useEffect, useState } from 'react'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import { loadConfig, getConfig, getApiBaseUrl } from './utils/config'

// Lazy loading으로 페이지 컴포넌트들 불러오기
const Landing = lazy(() => import('./pages/Landing'))
const Queue = lazy(() => import('./pages/Queue'))
const Reserve = lazy(() => import('./pages/Reserve'))
const Payment = lazy(() => import('./pages/Payment'))
const Confirm = lazy(() => import('./pages/Confirm'))

function App() {
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true // StrictMode 중복 실행 방지

    // 앱 시작시 설정 로드
    loadConfig()
      .then(() => {
        if (!isMounted) return // cleanup 체크

        setConfigLoaded(true)
        console.log('🚀 App config loaded successfully')

        // Local 모드일 때 API 연결 테스트
        const config = getConfig()
        if (config.API_MODE === 'local') {
          const baseUrl = getApiBaseUrl()
          if (baseUrl) {
            // Health check (한 번만)
            fetch(`${baseUrl}/healthz`, {
              method: 'GET'
            })
              .then(response => {
                console.log('🔗 API Gateway connection test:', response.status)
              })
              .catch(error => {
                console.log('⚠️ API Gateway connection failed:', error.message)
              })
          }
        }
      })
      .catch(error => {
        if (!isMounted) return
        console.error('Failed to load app config:', error)
        setConfigLoaded(true) // 기본 설정으로 계속 진행
      })

    return () => {
      isMounted = false // cleanup
    }
  }, [])

  if (!configLoaded) {
    return <LoadingSpinner />
  }

  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/reserve" element={<Reserve />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/confirm" element={<Confirm />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
