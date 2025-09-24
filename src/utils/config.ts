// 런타임 설정 타입 정의
export interface AppConfig {
  API_BASE: string
  API_MODE: 'mock' | 'local' | 'production'
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
  API_BASE: 'https://api.traffictacos.store',
  API_MODE: 'mock',
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

// Reserve runtime asset path resolution so SPA served from sub-path still finds configs
function buildConfigUrl(filename: string): string {
  const baseFromEnv = import.meta.env.BASE_URL ?? '/'
  const normalizedBase = baseFromEnv.endsWith('/') ? baseFromEnv : `${baseFromEnv}/`
  const sanitizedFilename = filename.startsWith('/') ? filename.slice(1) : filename

  if (typeof window !== 'undefined') {
    const originBase = new URL(normalizedBase, window.location.origin)
    return new URL(sanitizedFilename, originBase).toString()
  }

  return `${normalizedBase}${sanitizedFilename}`
}

export function resolveConfigAssetUrl(path: string): string {
  try {
    return buildConfigUrl(path)
  } catch (error) {
    console.warn('Failed to resolve config URL, falling back to relative path:', error)
    return path
  }
}

/**
 * 런타임 설정을 로드합니다.
 * /public/config.json 파일을 fetch하여 설정을 가져옵니다.
 * 개발 모드에서는 localStorage에서 오버라이드 설정도 확인합니다.
 * 실패 시 기본 설정을 반환합니다.
 */
export async function loadConfig(): Promise<AppConfig> {
  if (configCache) {
    return configCache
  }

  try {
    // 개발 모드에서 localStorage 오버라이드 확인
    const devOverride = localStorage.getItem('dev_api_config')
    if (devOverride && defaultConfig.ENV === 'development') {
      try {
        const overrideConfig = JSON.parse(devOverride)
        configCache = {
          ...defaultConfig,
          ...overrideConfig,
          FEATURES: {
            ...defaultConfig.FEATURES,
            ...overrideConfig.FEATURES,
          },
        }
        console.log('🔧 Dev override config loaded:', configCache?.API_MODE)
        return configCache!
      } catch (error) {
        console.warn('Invalid dev override config, ignoring:', error)
        localStorage.removeItem('dev_api_config')
      }
    }

    const configUrl = resolveConfigAssetUrl('config.json')
    const response = await fetch(configUrl, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status} from ${configUrl}`)
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

    console.log('⚙️ Config loaded:', configCache?.API_MODE, 'from', configCache?.API_BASE)
    return configCache!
  } catch (error) {
    console.warn('Config load failed, using safe defaults:', error)
    // 실패해도 토글 보이도록 개발 모드 기본값 설정
    configCache = {
      ...defaultConfig,
      ENV: 'development', // ← 실패해도 토글 보이도록
    }
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

/**
 * 현재 API 모드를 반환합니다.
 */
export function getApiMode(): AppConfig['API_MODE'] {
  return getConfig().API_MODE
}

/**
 * API 모드에 따른 기본 URL을 반환합니다.
 */
export function getApiBaseUrl(): string {
  const config = getConfig()

  switch (config.API_MODE) {
    case 'mock':
      return '' // Mock API는 URL이 필요 없음
    case 'local':
      return 'http://localhost:8010' // reservation-api 로컬 서버
    case 'production':
      return config.API_BASE // Route53으로 설정된 도메인
    default:
      return config.API_BASE
  }
}

/**
 * API 모드별 prefix 설정을 반환합니다.
 */
export function getApiPrefix(): string {
  const config = getConfig()

  switch (config.API_MODE) {
    case 'production':
      return '/api/v1/reservations' // Route53에서 prefix routing
    default:
      return '/api/v1/reservations'
  }
}
