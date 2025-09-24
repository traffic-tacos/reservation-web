import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy, useEffect, useState } from 'react'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import { loadConfig } from './utils/config'

// Lazy loading으로 페이지 컴포넌트들 불러오기
const Landing = lazy(() => import('./pages/Landing'))
const Queue = lazy(() => import('./pages/Queue'))
const Reserve = lazy(() => import('./pages/Reserve'))
const Payment = lazy(() => import('./pages/Payment'))
const Confirm = lazy(() => import('./pages/Confirm'))

function App() {
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    // 앱 시작시 설정 로드
    loadConfig()
      .then(() => {
        setConfigLoaded(true)
        console.log('🚀 App config loaded successfully')
      })
      .catch(error => {
        console.error('Failed to load app config:', error)
        setConfigLoaded(true) // 기본 설정으로 계속 진행
      })
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
