// 런타임 설정 타입 정의
export interface AppConfig {
  API_BASE: string
  ENV: 'development' | 'staging' | 'production'
  FEATURES: {
    REQUIRE_LOGIN_TO_RESERVE: boolean
    ENABLE_ANALYTICS: boolean
    ENABLE_ERROR_REPORTING: boolean
  }
  QUEUE_POLLING_INTERVAL: number
  RESERVATION_HOLD_TIME: number
  PAYMENT_TIMEOUT: number
}

// 기본 설정값
const defaultConfig: AppConfig = {
  API_BASE: 'https://api.traffic-tacos.com',
  ENV: 'development',
  FEATURES: {
    REQUIRE_LOGIN_TO_RESERVE: false,
    ENABLE_ANALYTICS: true,
    ENABLE_ERROR_REPORTING: true,
  },
  QUEUE_POLLING_INTERVAL: 2000,
  RESERVATION_HOLD_TIME: 60,
  PAYMENT_TIMEOUT: 300,
}

// 전역 설정 캐시
let configCache: AppConfig | null = null

/**
 * 런타임 설정을 로드합니다.
 * /public/config.json 파일을 fetch하여 설정을 가져옵니다.
 * 실패 시 기본 설정을 반환합니다.
 */
export async function loadConfig(): Promise<AppConfig> {
  if (configCache) {
    return configCache
  }

  try {
    const response = await fetch('/config.json')
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status}`)
    }

    const config = await response.json()

    // 기본 설정과 병합하여 유효성 검증
    configCache = {
      ...defaultConfig,
      ...config,
      FEATURES: {
        ...defaultConfig.FEATURES,
        ...config.FEATURES,
      },
    }

    return configCache!
  } catch (error) {
    console.warn('Failed to load config.json, using defaults:', error)
    configCache = defaultConfig
    return configCache
  }
}

/**
 * 동기적으로 캐시된 설정을 반환합니다.
 * 설정이 로드되지 않은 경우 기본 설정을 반환합니다.
 */
export function getConfig(): AppConfig {
  return configCache ?? defaultConfig
}

/**
 * 설정이 특정 환경인지 확인합니다.
 */
export function isEnvironment(env: AppConfig['ENV']): boolean {
  return getConfig().ENV === env
}

/**
 * 특정 기능이 활성화되어 있는지 확인합니다.
 */
export function isFeatureEnabled(feature: keyof AppConfig['FEATURES']): boolean {
  return getConfig().FEATURES[feature]
}
