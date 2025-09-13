import ky from 'ky'
import { v4 as uuidv4 } from 'uuid'
import { getConfig } from '@/utils/config'

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

// 기본 ky 인스턴스 생성
const api = ky.create({
  prefixUrl: getConfig().API_BASE,
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
        // Authorization 헤더 추가 (JWT가 있는 경우)
        const token = localStorage.getItem('auth_token')
        if (token) {
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

// HTTP 메소드 래퍼 함수들
export const apiClient = {
  get: <T = any>(url: string, options?: RequestInit) =>
    api.get(url, options).json<ApiResponse<T>>().then(res => res.data),

  post: <T = any>(url: string, data?: any, options?: RequestInit) =>
    api.post(url, { json: data, ...options }).json<ApiResponse<T>>().then(res => res.data),

  put: <T = any>(url: string, data?: any, options?: RequestInit) =>
    api.put(url, { json: data, ...options }).json<ApiResponse<T>>().then(res => res.data),

  patch: <T = any>(url: string, data?: any, options?: RequestInit) =>
    api.patch(url, { json: data, ...options }).json<ApiResponse<T>>().then(res => res.data),

  delete: <T = any>(url: string, options?: RequestInit) =>
    api.delete(url, options).json<ApiResponse<T>>().then(res => res.data),
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
