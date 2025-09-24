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
  const baseUrl = getApiBaseUrl()

  // Mock 모드의 경우 ky 인스턴스 없이 직접 처리
  if (!baseUrl) {
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
        // Authorization 헤더 추가
        const token = localStorage.getItem('auth_token')

        // 개발 모드에서는 개발용 슈퍼키 사용
        if (!token && getConfig().ENV === 'development') {
          request.headers.set('Authorization', `Bearer dev-super-key-local-testing`)
          request.headers.set('X-Dev-Mode', 'true')
        } else if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
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
          console.log(`API ${request.method} ${request.url} -> ${response.status}`)
        }

        // 에러 응답 처리
        if (!response.ok) {
          let errorData: ApiResponse
          try {
            errorData = await response.json()
          } catch {
            errorData = { error: { code: 'UNKNOWN_ERROR', message: '알 수 없는 오류가 발생했습니다.' } }
          }

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

// HTTP 메소드 래퍼 함수들
export const apiClient = {
  get: <T = any>(url: string, options?: RequestInit) => {
    const api = getApi()
    if (!api) throw new Error('API client not available in mock mode')
    return api.get(url, options).json<ApiResponse<T>>().then(res => res.data)
  },

  post: <T = any>(url: string, data?: any, options?: RequestInit) => {
    const api = getApi()
    if (!api) throw new Error('API client not available in mock mode')
    return api.post(url, { json: data, ...options }).json<ApiResponse<T>>().then(res => res.data)
  },

  put: <T = any>(url: string, data?: any, options?: RequestInit) => {
    const api = getApi()
    if (!api) throw new Error('API client not available in mock mode')
    return api.put(url, { json: data, ...options }).json<ApiResponse<T>>().then(res => res.data)
  },

  patch: <T = any>(url: string, data?: any, options?: RequestInit) => {
    const api = getApi()
    if (!api) throw new Error('API client not available in mock mode')
    return api.patch(url, { json: data, ...options }).json<ApiResponse<T>>().then(res => res.data)
  },

  delete: <T = any>(url: string, options?: RequestInit) => {
    const api = getApi()
    if (!api) throw new Error('API client not available in mock mode')
    return api.delete(url, options).json<ApiResponse<T>>().then(res => res.data)
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
