import { apiClient } from './client'
import { getConfig } from '@/utils/config'

// ============================
// API 요청/응답 타입 정의
// ============================

export interface RegisterRequest {
  username: string      // 3-20자, 영문+숫자
  password: string      // 최소 6자
  email: string         // 유효한 이메일
  display_name: string  // 표시 이름
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  token: string         // JWT 토큰 (24시간 유효)
  user_id: string       // UUID
  username: string
  display_name: string
  role: string          // "user" | "admin"
  expires_in: number    // 초 단위 (86400 = 24시간)
}

// ============================
// Auth API 클라이언트
// ============================

export const authApi = {
  /**
   * 회원가입 API
   * 
   * @param data 회원가입 정보
   * @returns AuthResponse (토큰 포함)
   * 
   * @example
   * const response = await authApi.register({
   *   username: 'testuser',
   *   password: 'testpass123',
   *   email: 'test@traffictacos.store',
   *   display_name: 'Test User'
   * })
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const mode = getConfig().API_MODE

    // Mock 모드 (개발 환경에서만)
    if (mode === 'mock' && !import.meta.env.PROD) {
      console.log('🎭 [MOCK] Register - username:', data.username)
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      const mockToken = `mock-jwt-${Date.now()}-${data.username}`
      return {
        token: mockToken,
        user_id: `mock-user-${Date.now()}`,
        username: data.username,
        display_name: data.display_name,
        role: 'user',
        expires_in: 86400, // 24시간
      }
    }

    // Local/Production 모드 - 실제 API 호출
    console.log('🔐 [AUTH] Register - username:', data.username)
    try {
      const response = await apiClient.post<AuthResponse>('api/v1/auth/register', data, {
        headers: {
          'Idempotency-Key': crypto.randomUUID(),
        },
      })
      console.log('✅ [AUTH] Register SUCCESS - user_id:', response.user_id)
      return response
    } catch (error: any) {
      console.error('❌ [AUTH] Register FAILED:', error)
      
      // 에러 코드별 메시지 변환
      if (error.code === 'USERNAME_EXISTS') {
        throw new Error('이미 사용 중인 사용자명입니다.')
      } else if (error.code === 'INVALID_REQUEST') {
        throw new Error('입력 정보가 올바르지 않습니다. 다시 확인해주세요.')
      }
      
      throw new Error(error.message || '회원가입에 실패했습니다. 다시 시도해주세요.')
    }
  },

  /**
   * 로그인 API
   * 
   * @param data 로그인 정보 (username, password)
   * @returns AuthResponse (토큰 포함)
   * 
   * @example
   * const response = await authApi.login({
   *   username: 'user01',
   *   password: 'pwd01'
   * })
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const mode = getConfig().API_MODE

    // Mock 모드 (개발 환경에서만)
    if (mode === 'mock' && !import.meta.env.PROD) {
      console.log('🎭 [MOCK] Login - username:', data.username)
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      // Mock 로그인 성공
      const mockToken = `mock-jwt-${Date.now()}-${data.username}`
      return {
        token: mockToken,
        user_id: `mock-user-${Date.now()}`,
        username: data.username,
        display_name: data.username,
        role: 'user',
        expires_in: 86400,
      }
    }

    // Local/Production 모드 - 실제 API 호출
    console.log('🔐 [AUTH] Login - username:', data.username)
    try {
      const response = await apiClient.post<AuthResponse>('api/v1/auth/login', data, {
        headers: {
          'Idempotency-Key': crypto.randomUUID(),
        },
      })
      console.log('✅ [AUTH] Login SUCCESS - user_id:', response.user_id)
      return response
    } catch (error: any) {
      console.error('❌ [AUTH] Login FAILED:', error)
      
      // 에러 코드별 메시지 변환
      if (error.code === 'INVALID_CREDENTIALS') {
        throw new Error('사용자명 또는 비밀번호가 올바르지 않습니다.')
      } else if (error.code === 'RATE_LIMITED') {
        throw new Error('너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.')
      }
      
      throw new Error(error.message || '로그인에 실패했습니다. 다시 시도해주세요.')
    }
  },
}

// ============================
// LocalStorage 헬퍼 함수
// ============================

/**
 * 인증 정보를 LocalStorage에 저장
 */
export function saveAuthData(response: AuthResponse) {
  const expiresAt = Date.now() + response.expires_in * 1000

  localStorage.setItem('auth_token', response.token)
  localStorage.setItem('user_id', response.user_id)
  localStorage.setItem('username', response.username)
  localStorage.setItem('display_name', response.display_name)
  localStorage.setItem('role', response.role)
  localStorage.setItem('token_expires_at', expiresAt.toString())

  console.log('💾 [AUTH] Auth data saved to localStorage')
  console.log('   user_id:', response.user_id)
  console.log('   username:', response.username)
  console.log('   expires_at:', new Date(expiresAt).toISOString())
}

/**
 * 인증 정보를 LocalStorage에서 제거
 */
export function clearAuthData() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_id')
  localStorage.removeItem('username')
  localStorage.removeItem('display_name')
  localStorage.removeItem('role')
  localStorage.removeItem('token_expires_at')

  console.log('🗑️ [AUTH] Auth data cleared from storage')
}

/**
 * 토큰 만료 여부 확인
 */
export function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem('token_expires_at')
  if (!expiresAt) return true

  const expired = Date.now() > parseInt(expiresAt)
  if (expired) {
    console.warn('⏰ [AUTH] Token expired')
  }
  return expired
}

/**
 * 현재 로그인된 사용자 정보 가져오기
 */
export function getCurrentUser() {
  const token = localStorage.getItem('auth_token')
  const userId = localStorage.getItem('user_id')
  const username = localStorage.getItem('username')
  const displayName = localStorage.getItem('display_name')
  const role = localStorage.getItem('role')

  if (!token || !userId) {
    return null
  }

  // 토큰 만료 체크
  if (isTokenExpired()) {
    clearAuthData()
    return null
  }

  return {
    user_id: userId,
    username: username || '',
    display_name: displayName || username || '',
    role: role || 'user',
  }
}

