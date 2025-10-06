import ky from 'ky'
import { v4 as uuidv4 } from 'uuid'
import { getConfig, getApiBaseUrl } from '@/utils/config'

// API 에러 타입 정의
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public traceId?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// API 응답 타입
interface ApiResponse<T = any> {
  data?: T
  error?: {
    code: string
    message: string
    trace_id?: string
  }
}

// 멱등성 키 생성 함수
export function generateIdempotencyKey(): string {
  return uuidv4()
}

// 동적으로 API 클라이언트 생성 함수
function createApiClient() {
  const baseUrl = getApiBaseUrl();
  console.log('🔧 createApiClient - baseUrl:', baseUrl, 'API_MODE:', getConfig().API_MODE)

  // Mock 모드의 경우 ky 인스턴스 없이 직접 처리
  if (!baseUrl) {
    console.log('⚠️ createApiClient - baseUrl is empty, returning null')
    return null
  }

  return ky.create({
    prefixUrl: baseUrl,
    timeout: 5000, // 5초 타임아웃
    retry: {
      limit: 2,
      methods: ['get'], // GET만 재시도
      statusCodes: [408, 429, 500, 502, 503, 504],
      backoffLimit: 30000, // 최대 30초 백오프
    },
    hooks: {
    beforeRequest: [
      (request) => {
        // Authorization 헤더 추가 (JWT 토큰만 사용)
        const token = localStorage.getItem('auth_token')

        if (token) {
          console.log('🔑 [AUTH] Using JWT token')
          request.headers.set('Authorization', `Bearer ${token}`)
        } else {
          console.log('🔓 [AUTH] No token - proceeding without Authorization header')
        }

        // OpenTelemetry 트레이싱 헤더 (필요시)
        const traceId = generateIdempotencyKey()
        request.headers.set('X-Trace-Id', traceId)
      },
    ],
    beforeRetry: [
      ({ request }) => {
        console.warn(`Retrying request: ${request.url}`)
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        // 응답 로깅 (개발 환경에서만)
        if (getConfig().ENV === 'development') {
          console.log(`📊 API ${request.method} ${request.url} -> ${response.status}`)
        }

        // 에러 응답 처리
        if (!response.ok) {
          let errorData: ApiResponse
          try {
            errorData = await response.json()
          } catch {
            errorData = { error: { code: 'UNKNOWN_ERROR', message: '알 수 없는 오류가 발생했습니다.' } }
          }

          // 부하 테스트용: 에러 상세 로깅
          console.warn(`⚠️ [LOAD TEST] API Error: ${request.method} ${request.url}`)
          console.warn(`   Status: ${response.status}`)
          console.warn(`   Code: ${errorData.error?.code}`)
          console.warn(`   Message: ${errorData.error?.message}`)

          if (errorData.error) {
            throw new ApiError(
              errorData.error.code,
              errorData.error.message,
              response.status,
              errorData.error.trace_id
            )
          }
        }
      },
    ],
  },
  })
}

// API 클라이언트 인스턴스 가져오기
function getApi() {
  return createApiClient()
}

// 응답 데이터 추출 헬퍼 함수 (wrapper 있든 없든 처리)
function extractResponseData<T>(res: any): T {
  // Case 1: { data: {...} } 형식 (wrapper 있음)
  if (res.data !== undefined) {
    console.log('📦 [LOAD TEST] Response has data wrapper')
    return res.data as T
  }
  
  // Case 2: {...} 형식 (wrapper 없음 - 직접 데이터)
  // error 필드가 없으면 응답 자체가 데이터
  if (res.error === undefined) {
    console.log('📦 [LOAD TEST] Response is direct data (no wrapper)')
    return res as T
  }
  
  // Case 3: 에러 응답
  throw new Error('API response data is missing')
}

// HTTP 메소드 래퍼 함수들
export const apiClient = {
  get: <T = any>(url: string, options?: RequestInit) => {
    const api = getApi()
    if (!api) throw new Error('API client not available in mock mode')
    return api.get(url, options).json<any>().then(res => {
      return extractResponseData<T>(res)
    })
  },

  post: <T = any>(url: string, data?: any, options?: RequestInit) => {
    console.log('📡 [LOAD TEST] POST request - url:', url)
    const api = getApi()
    if (!api) {
      console.error('❌ API client not available - api instance is null')
      throw new Error('API client not available in mock mode')
    }
    return api.post(url, { json: data, ...options }).json<any>().then(res => {
      console.log('✅ [LOAD TEST] POST response received:', res)
      return extractResponseData<T>(res)
    })
  },

  put: <T = any>(url: string, data?: any, options?: RequestInit) => {
    const api = getApi()
    if (!api) throw new Error('API client not available in mock mode')
    return api.put(url, { json: data, ...options }).json<any>().then(res => {
      return extractResponseData<T>(res)
    })
  },

  patch: <T = any>(url: string, data?: any, options?: RequestInit) => {
    const api = getApi()
    if (!api) throw new Error('API client not available in mock mode')
    return api.patch(url, { json: data, ...options }).json<any>().then(res => {
      return extractResponseData<T>(res)
    })
  },

  delete: <T = any>(url: string, options?: RequestInit) => {
    const api = getApi()
    if (!api) throw new Error('API client not available in mock mode')
    return api.delete(url, options).json<any>().then(res => {
      return extractResponseData<T>(res)
    })
  },
}

// 멱등성 키를 포함한 POST 요청 헬퍼
export function postWithIdempotency<T = any>(
  url: string,
  data: any,
  idempotencyKey?: string
): Promise<T> {
  const key = idempotencyKey || generateIdempotencyKey()
  return apiClient.post<T>(url, data, {
    headers: {
      'Idempotency-Key': key,
    },
  }) as Promise<T>
}
