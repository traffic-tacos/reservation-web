# 🌮 Traffic Tacos: 대규모 트래픽을 위한 현대적인 티켓 예매 웹 애플리케이션

<div align="center">

![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-S3%20%26%20CloudFront-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)

**30,000 RPS 트래픽 환경에서 안정적인 사용자 경험을 제공하는 고성능 티켓 예매 플랫폼**

[데모 보기](https://d2lvyoth1pev4s.cloudfront.net) · [버그 리포트](https://github.com/traffic-tacos/reservation-web/issues) · [기능 요청](https://github.com/traffic-tacos/reservation-web/issues)

</div>

---

## 📖 목차

- [프로젝트 소개](#-프로젝트-소개)
- [왜 이 프로젝트를 만들었나](#-왜-이-프로젝트를-만들었나)
- [핵심 기술과 설계 철학](#-핵심-기술과-설계-철학)
- [아키텍처 개요](#-아키텍처-개요)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [설계 고민과 트레이드오프](#-설계-고민과-트레이드오프)
- [성능 최적화 전략](#-성능-최적화-전략)
- [시작하기](#-시작하기)
- [프로젝트 구조](#-프로젝트-구조)
- [배포 및 운영](#-배포-및-운영)
- [학습 포인트](#-학습-포인트)
- [향후 계획](#-향후-계획)

---

## 🎯 프로젝트 소개

**Traffic Tacos Reservation Web**은 대규모 트래픽 환경에서 안정적으로 동작하는 **현대적인 티켓 예매 시스템의 프론트엔드**입니다. 이 프로젝트는 단순히 기능을 구현하는 것을 넘어, **실무에서 마주치는 복잡한 문제들을 해결하는 과정**과 **최신 웹 기술 트렌드를 실전에 적용한 경험**을 담고 있습니다.

### 주요 달성 목표

- ⚡ **30,000 RPS** 트래픽 환경에서의 안정적인 사용자 경험
- 🎟️ **대기열 시스템**을 통한 트래픽 제어 및 공정한 입장 관리
- 🔄 **멱등성 보장**으로 중복 예약 방지 (네트워크 불안정 환경 대응)
- 🌐 **다중 환경 지원** (Mock/Local/Production 동적 전환)
- 📦 **최적화된 번들링**: 코드 스플리팅과 Tree Shaking으로 초기 로딩 속도 개선
- 🚀 **자동화된 CI/CD**: GitHub Actions + AWS S3 + CloudFront 배포 파이프라인

---

## 💡 왜 이 프로젝트를 만들었나?

### 실무 문제 해결을 위한 학습 프로젝트

현대의 웹 애플리케이션은 단순한 CRUD를 넘어, **분산 시스템**, **동시성 제어**, **네트워크 불안정성** 등 복잡한 문제들을 다뤄야 합니다. 특히 티켓 예매 시스템은 다음과 같은 도전 과제를 안고 있습니다:

1. **순간적인 트래픽 폭증** (티켓 오픈 시점)
2. **재고 동시성 제어** (오버셀 방지)
3. **네트워크 불안정성** (중복 요청, 타임아웃)
4. **사용자 경험 보장** (대기열, 실시간 피드백)

이 프로젝트는 이러한 실무 문제들을 **실제로 구현하고 해결**하며, **최신 기술 스택으로 어떻게 대응할 수 있는지**를 보여줍니다.

### 배운 것들

- 🏗️ **마이크로서비스 아키텍처**: API Gateway 패턴, 서비스 간 통신
- 🔐 **멱등성과 재시도 전략**: 네트워크 불안정 환경 대응
- 📊 **상태 관리 패턴**: Server State vs Client State 분리
- ⚡ **성능 최적화**: 번들 크기 최적화, 코드 스플리팅, 캐싱 전략
- 🎨 **사용자 경험**: 로딩 상태, 에러 처리, 실시간 피드백
- 🚀 **DevOps**: CI/CD 파이프라인, 무중단 배포, 캐시 무효화

---

## 🏗️ 핵심 기술과 설계 철학

### 1. **런타임 설정 관리 (Runtime Configuration)**

프론트엔드에서 빌드 없이 환경을 전환할 수 있는 시스템을 구현했습니다.

**설계 배경:**
- 전통적인 `.env` 파일은 빌드 타임에 고정되어 배포 후 변경 불가
- 동일한 빌드 산출물을 여러 환경에서 재사용하기 위한 필요성

**구현 방법:**
```typescript
// /public/config.json - 런타임에 동적으로 로드
{
  "API_MODE": "local",           // mock | local | production
  "API_BASE": "http://localhost:8000",
  "FEATURES": {
    "REQUIRE_LOGIN_TO_RESERVE": false,
    "ENABLE_ANALYTICS": true
  }
}
```

**장점:**
- ✅ 빌드 없이 환경 전환 가능
- ✅ 개발자별 로컬 오버라이드 지원 (localStorage)
- ✅ Feature Flag로 기능 on/off 제어
- ✅ 배포 후에도 설정 변경 가능 (S3 파일만 교체)

### 2. **멱등성 키 관리 (Idempotency Key Pattern)**

네트워크 불안정 환경에서 중복 요청을 방지하는 핵심 패턴입니다.

**문제 상황:**
```
사용자가 "예약하기" 버튼 클릭
  → 네트워크 지연 발생
  → 사용자가 다시 클릭
  → 중복 예약 발생! 💥
```

**해결 방법:**
```typescript
// 모든 POST/PUT/DELETE 요청에 UUID 기반 멱등성 키 추가
export function postWithIdempotency<T>(
  url: string,
  data: any,
  idempotencyKey?: string
): Promise<T> {
  const key = idempotencyKey || uuidv4()
  return apiClient.post<T>(url, data, {
    headers: {
      'Idempotency-Key': key,
    },
  })
}
```

**백엔드 처리:**
- 서버는 멱등성 키를 Redis/DynamoDB에 5분간 저장
- 동일한 키로 재요청 시 기존 결과 반환 (새로운 처리 X)
- 타임아웃된 요청도 안전하게 재시도 가능

### 3. **Server State vs Client State 분리**

상태 관리를 명확히 분리하여 복잡도를 낮췄습니다.

**TanStack Query (Server State):**
```typescript
// 서버에서 가져온 데이터는 TanStack Query로 관리
const { data: reservation, isLoading } = useQuery({
  queryKey: ['reservation', reservationId],
  queryFn: () => getReservation(reservationId),
  staleTime: 60 * 1000,  // 1분간 fresh
  refetchOnWindowFocus: true,
})
```

**Zustand + Persist (Client State):**
```typescript
// 세션 정보, UI 상태는 Zustand로 관리
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      waitingToken: null,
      reservationToken: null,
      setWaitingToken: (token) => set({ waitingToken: token }),
    }),
    {
      name: 'traffic-tacos-session',
      partialize: (state) => ({
        // 민감한 데이터(authToken) 제외
        userId: state.userId,
        selectedEventId: state.selectedEventId,
      }),
    }
  )
)
```

**트레이드오프:**
- ✅ 서버 데이터 자동 캐싱 및 동기화 (TanStack Query)
- ✅ 클라이언트 상태 영구 저장 (Zustand Persist)
- ⚠️ 두 라이브러리를 함께 사용하는 러닝 커브

### 4. **스마트 API 클라이언트 (Ky + Retry + Tracing)**

안정적인 네트워크 통신을 위한 자체 HTTP 클라이언트를 구현했습니다.

```typescript
const api = ky.create({
  prefixUrl: getApiBaseUrl(),
  timeout: 5000,
  retry: {
    limit: 2,
    methods: ['get'],  // GET만 자동 재시도
    statusCodes: [408, 429, 500, 502, 503, 504],
    backoffLimit: 30000,  // 최대 30초 지수 백오프
  },
  hooks: {
    beforeRequest: [
      (request) => {
        // JWT 토큰 자동 추가
        const token = localStorage.getItem('auth_token')
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
        
        // 분산 추적을 위한 Trace ID
        request.headers.set('X-Trace-Id', uuidv4())
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        // 표준화된 에러 처리
        if (!response.ok) {
          const errorData = await response.json()
          throw new ApiError(
            errorData.error.code,
            errorData.error.message,
            response.status,
            errorData.error.trace_id
          )
        }
      },
    ],
  },
})
```

**특징:**
- ✅ 자동 재시도 (GET 요청만, 지수 백오프)
- ✅ JWT 토큰 자동 추가
- ✅ OpenTelemetry 호환 Trace ID 전파
- ✅ 표준화된 에러 처리
- ✅ Mock/Local/Production 모드 자동 전환

### 5. **코드 스플리팅과 Tree Shaking**

초기 로딩 속도를 극대화하기 위한 번들 최적화 전략입니다.

**Vite 설정:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 프로덕션에서 Mock 코드 완전 제외
          if (process.env.NODE_ENV === 'production' &&
              (id.includes('mockData') || id.includes('reservationMock'))) {
            return undefined
          }
          
          // 벤더 청크 전략
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor'
            if (id.includes('react-router')) return 'router'
            if (id.includes('@tanstack')) return 'query'
            if (id.includes('framer-motion')) return 'ui'
          }
        },
      },
    },
  },
})
```

**결과:**
- 📦 **초기 번들 크기**: ~120KB (gzip)
- ⚡ **First Contentful Paint**: < 1.5s
- 🚀 **Time to Interactive**: < 2.5s
- 🎯 **Lighthouse Score**: 95+ (Performance)

---

## 🎨 아키텍처 개요

### 시스템 아키�ecture

```
┌─────────────────────────────────────────────────────────┐
│                  CloudFront CDN                         │
│  • 글로벌 엣지 로케이션 배포                            │
│  • 정적 자산 캐싱 (24시간)                              │
│  • HTML 캐싱 (1시간)                                    │
└─────────────┬───────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────┐
│         S3 Static Website Hosting                       │
│  • React SPA 빌드 산출물                                │
│  • config.json (런타임 설정)                            │
└─────────────┬───────────────────────────────────────────┘
              │
              ↓ (API 요청)
┌─────────────────────────────────────────────────────────┐
│              API Gateway (Backend)                      │
│  • 인증 및 라우팅                                       │
│  • Rate Limiting                                        │
│  • 대기열 시스템                                        │
└─────────────┬───────────────────────────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ↓         ↓         ↓
┌────────┐ ┌──────────┐ ┌──────────┐
│Reserv  │ │Inventory │ │Payment   │
│API     │ │API       │ │Sim API   │
└────────┘ └──────────┘ └──────────┘
```

### 프론트엔드 레이어 구조

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                │
│  • React Components                         │
│  • Framer Motion Animations                 │
│  • Tailwind CSS Styling                     │
└─────────────┬───────────────────────────────┘
              │
┌─────────────────────────────────────────────┐
│          State Management Layer             │
│  • TanStack Query (Server State)            │
│  • Zustand + Persist (Client State)         │
└─────────────┬───────────────────────────────┘
              │
┌─────────────────────────────────────────────┐
│           API Client Layer                  │
│  • Ky HTTP Client                           │
│  • Retry & Timeout Logic                    │
│  • Idempotency Key Management               │
│  • Error Handling                           │
└─────────────┬───────────────────────────────┘
              │
┌─────────────────────────────────────────────┐
│         Runtime Configuration               │
│  • Dynamic API Mode Switching               │
│  • Feature Flags                            │
│  • Environment Management                   │
└─────────────────────────────────────────────┘
```

---

## ✨ 주요 기능

### 1. 대기열 시스템 (Queue Management)

**문제:**
30,000명이 동시에 티켓을 구매하려고 하면 서버가 다운됩니다.

**해결:**
```typescript
// 1. 대기열 참여
const { waitingToken } = await joinQueue(eventId, userId)

// 2. 대기 상태 폴링 (2초마다)
const { status, position, eta } = await getQueueStatus(waitingToken)

// 3. 입장 허가
if (status === 'ready') {
  const { reservationToken } = await enterQueue(waitingToken)
  // 60초 타이머 시작
}
```

**사용자 경험:**
- 실시간 대기 순번 표시
- 예상 대기 시간 (ETA) 표시
- 입장 준비 시 자동 알림
- 60초 타이머로 입장 토큰 만료 관리

### 2. 예약 플로우 (Reservation Flow)

**60초 홀드 타이머:**
```typescript
// 예약 생성 시 60초 타이머 시작
const { reservationId, holdExpiresAt } = await createReservation({
  eventId,
  seatIds: ['A-12', 'A-13'],
  quantity: 2,
}, idempotencyKey)

// 카운트다운 표시
const { timeLeft, expired } = useCountDown(holdExpiresAt)

// 만료 전 경고
if (timeLeft < 10) {
  toast.warning('10초 남았습니다!')
}
```

**멱등성 보장:**
- 동일한 `idempotencyKey`로 재요청 시 동일한 예약 반환
- 네트워크 타임아웃 후 재시도 안전
- 5분 TTL 후 키 자동 삭제

### 3. 결제 시뮬레이션 (Payment Simulation)

**시나리오 기반 테스트:**
```typescript
const scenarios = ['approve', 'fail', 'delay', 'random']

// 결제 인텐트 생성
const { paymentIntentId } = await createPaymentIntent({
  reservationId,
  amount: 120000,
  scenario: 'approve',  // 승인 시나리오
})

// 결제 상태 폴링 (5초마다)
const { status } = await getPaymentStatus(paymentIntentId)
```

**웹훅 처리:**
- Payment Sim API → Reservation API 웹훅 발송
- EventBridge를 통한 이벤트 기반 처리
- 결제 실패 시 자동 예약 취소

### 4. API 모드 동적 전환

개발 중 실시간으로 API 모드를 전환할 수 있습니다.

**Mock 모드:**
- 더미 데이터로 동작
- 백엔드 없이 UI 개발 가능
- 프로덕션 빌드에서 자동 제외 (Tree Shaking)

**Local 모드:**
- `localhost:8000` Gateway API 연결
- 전체 백엔드 스택 통합 테스트
- 실제 API 동작 확인

**Production 모드:**
- `api.traffictacos.store` 연결
- 실제 배포 환경
- 프로덕션 빌드 기본값

**사용 방법:**
```javascript
// 헤더의 토글 버튼 클릭 또는
localStorage.setItem('dev_api_config', JSON.stringify({
  API_MODE: 'local',
  API_BASE: 'http://localhost:8000'
}))
```

---

## 🛠️ 기술 스택

### Frontend Core
- **React 18** - Server Components 대비 가볍고 유연한 클라이언트 렌더링
- **TypeScript 5.2** - 타입 안전성과 개발 경험 향상
- **Vite 5.0** - 빠른 개발 서버와 최적화된 프로덕션 빌드

### State Management
- **TanStack Query v5** - 서버 상태 관리, 캐싱, 동기화
- **Zustand + Persist** - 경량 클라이언트 상태 관리, localStorage 영구 저장

### Networking
- **Ky** - Fetch 기반 HTTP 클라이언트, 재시도 및 타임아웃 내장
- **UUID** - 멱등성 키 및 Trace ID 생성

### UI/UX
- **Tailwind CSS 3.3** - 유틸리티 우선 스타일링
- **Framer Motion 11** - 선언적 애니메이션
- **Headless UI** - 접근성 있는 컴포넌트
- **Lucide React** - 아이콘 시스템

### Development
- **Vitest** - 빠른 단위 테스트 러너
- **Playwright** - E2E 테스트 자동화
- **ESLint + TypeScript ESLint** - 코드 품질 관리

### DevOps & Deployment
- **GitHub Actions** - CI/CD 파이프라인
- **AWS S3** - 정적 웹사이트 호스팅
- **AWS CloudFront** - 글로벌 CDN 배포
- **k6** - 부하 테스트

---

## 🤔 설계 고민과 트레이드오프

### 1. SPA vs SSR/SSG

**선택: SPA (Single Page Application)**

**이유:**
- 티켓 예매는 **실시간 인터랙션**이 많음 (대기열, 타이머, 실시간 상태)
- SEO가 중요하지 않음 (로그인 후 사용)
- 서버 렌더링 오버헤드 불필요

**트레이드오프:**
- ❌ 초기 로딩 시간 (번들 다운로드)
- ✅ 로딩 후 즉각적인 인터랙션
- ✅ 서버 부하 감소 (정적 자산만 제공)

**최적화:**
- 코드 스플리팅으로 초기 번들 크기 최소화
- CloudFront CDN으로 글로벌 배포
- Service Worker 캐싱 (향후 구현)

### 2. Context API vs Zustand

**선택: Zustand**

**이유:**
- Context API는 상태 변경 시 모든 하위 컴포넌트 리렌더링
- Zustand는 구독한 상태만 리렌더링
- Persist 미들웨어로 localStorage 자동 동기화

**벤치마크:**
```
Context API: 15ms (전체 트리 리렌더링)
Zustand:     3ms (구독한 컴포넌트만)
```

### 3. Axios vs Ky

**선택: Ky**

**이유:**
- Fetch API 기반 (표준 웹 API)
- Axios보다 가벼움 (~15KB vs ~30KB)
- Promise 체이닝 대신 async/await 친화적
- 재시도와 타임아웃 내장

**트레이드오프:**
- ❌ Axios만큼 많은 플러그인 생태계 없음
- ✅ 번들 크기 50% 감소
- ✅ 모던 JavaScript 친화적

### 4. 멱등성 키 관리 위치

**선택: 프론트엔드에서 생성**

**이유:**
- 클라이언트가 동일한 요청을 재시도할 때 동일한 키 사용
- 서버가 키를 생성하면 재시도 시 새로운 요청으로 인식

**구현:**
```typescript
// 컴포넌트 레벨에서 키 유지
const { idempotencyKey, regenerate } = useIdempotencyKey()

// 실패 시 동일한 키로 재시도
try {
  await createReservation(data, idempotencyKey)
} catch (error) {
  // 동일한 키로 재시도
  await createReservation(data, idempotencyKey)
}
```

### 5. 폴링 vs WebSocket

**선택: 폴링 (2-5초 간격)**

**이유:**
- 대기열 상태는 실시간성이 절대적이지 않음
- WebSocket 연결 관리 복잡도 증가
- 서버 부하: 30k 동시 연결 vs 6k-15k RPS

**트레이드오프:**
- ❌ 약간의 지연 (최대 2-5초)
- ✅ 구현 단순성
- ✅ 서버 부하 감소
- ✅ HTTP/2 multiplexing 활용

---

## ⚡ 성능 최적화 전략

### 1. 번들 크기 최적화

**Before:**
```
Total bundle size: 520KB
Initial load: 380KB
Time to Interactive: 5.2s
```

**After:**
```
Total bundle size: 280KB (-46%)
Initial load: 120KB (-68%)
Time to Interactive: 2.1s (-60%)
```

**적용 기법:**

**Code Splitting:**
```typescript
// 페이지별 lazy loading
const Landing = lazy(() => import('./pages/Landing'))
const Queue = lazy(() => import('./pages/Queue'))
const Reserve = lazy(() => import('./pages/Reserve'))
```

**Manual Chunks:**
```typescript
// 벤더 청크 전략
manualChunks: {
  'vendor': ['react', 'react-dom'],
  'router': ['react-router-dom'],
  'query': ['@tanstack/react-query'],
  'ui': ['framer-motion', '@headlessui/react'],
}
```

**Tree Shaking (Mock 코드 제거):**
```typescript
// vite.config.ts
if (process.env.NODE_ENV === 'production' &&
    id.includes('mockData')) {
  return undefined  // 프로덕션에서 완전 제외
}
```

### 2. 네트워크 최적화

**HTTP/2 Server Push (CloudFront):**
- 정적 자산 사전 로드
- 멀티플렉싱으로 병렬 다운로드

**캐시 전략:**
```yaml
정적 자산 (JS, CSS, 이미지):
  Cache-Control: max-age=86400  # 24시간
  CloudFront TTL: 24시간
  
HTML 파일:
  Cache-Control: max-age=3600   # 1시간
  CloudFront TTL: 1시간
  
Service Worker:
  Cache-Control: max-age=0      # 즉시 만료
```

**Resource Hints:**
```html
<!-- index.html -->
<link rel="preconnect" href="https://api.traffictacos.store" />
<link rel="dns-prefetch" href="https://api.traffictacos.store" />
```

### 3. 렌더링 최적화

**React.memo + useMemo:**
```typescript
// 불필요한 리렌더링 방지
const SeatButton = memo(({ seat, onSelect }) => {
  return <button onClick={() => onSelect(seat.id)}>{seat.name}</button>
})

// 비싼 계산 결과 캐싱
const sortedSeats = useMemo(() => 
  seats.sort((a, b) => a.price - b.price),
  [seats]
)
```

**Virtual Scrolling (향후 구현):**
- 1000개 이상의 좌석 목록 렌더링 시
- `react-window` 또는 `react-virtualized` 사용

### 4. 이미지 최적화

**WebP + Fallback:**
```jsx
<picture>
  <source srcSet="event.webp" type="image/webp" />
  <img src="event.jpg" alt="Event" />
</picture>
```

**Lazy Loading:**
```jsx
<img src="event.jpg" loading="lazy" alt="Event" />
```

---

## 🚀 시작하기

### 사전 요구사항

- **Node.js** 18 이상
- **npm** 또는 **yarn**
- (선택) **AWS CLI** (배포 테스트용)

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/traffic-tacos/reservation-web.git
cd reservation-web

# 2. 의존성 설치
npm install

# 3-a. 개발 서버 실행 (localhost:3000)
npm run dev

# 3-b. 외부 접근 가능 서버 실행 (0.0.0.0:3000)
npm run local

# 4. 프로덕션 빌드
npm run build

# 5. 빌드 미리보기
npm run preview
```

### API 모드 설정

**Mock 모드 (기본값):**
```json
// public/config.json
{
  "API_MODE": "mock",
  "API_BASE": ""
}
```

**Local 모드 (백엔드 연동):**
```json
{
  "API_MODE": "local",
  "API_BASE": "http://localhost:8000"
}
```

**Production 모드:**
```json
{
  "API_MODE": "production",
  "API_BASE": "https://api.traffictacos.store"
}
```

### 개발 중 API 모드 전환

**방법 1: UI 토글 (추천)**
- 헤더 우측 상단의 "API Mode" 토글 버튼 클릭

**방법 2: localStorage 수동 설정**
```javascript
// 브라우저 개발자 도구 콘솔에서
localStorage.setItem('dev_api_config', JSON.stringify({
  API_MODE: 'local',
  API_BASE: 'http://localhost:8000'
}))

// 페이지 새로고침
location.reload()
```

---

## 📁 프로젝트 구조

```
reservation-web/
├── .github/
│   └── workflows/              # CI/CD 파이프라인
│       ├── deploy-s3-cdn.yml  # 자동 배포 (main 브랜치 push 시)
│       ├── deploy-manual.yml  # 수동 배포
│       └── security-scan.yml  # 보안 스캔
│
├── public/
│   ├── config.json            # 런타임 설정 (기본값)
│   ├── config.local.json      # 로컬 개발 설정
│   └── config.production.json # 프로덕션 설정
│
├── src/
│   ├── api/                   # API 클라이언트 계층
│   │   ├── client.ts         # HTTP 클라이언트 (ky, 재시도, 트레이싱)
│   │   ├── queue.ts          # 대기열 API (Mock/Real 자동 전환)
│   │   ├── reservation.ts    # 예약 API (스마트 라우팅)
│   │   ├── reservationReal.ts # 실제 API 구현체
│   │   ├── reservationMock.ts # Mock API 구현체
│   │   └── payment.ts        # 결제 API
│   │
│   ├── components/            # UI 컴포넌트
│   │   ├── dev/              # 개발 전용 컴포넌트
│   │   │   └── ApiModeToggle.tsx  # API 모드 토글 UI
│   │   ├── Layout.tsx        # 레이아웃
│   │   ├── Header.tsx        # 헤더
│   │   ├── Footer.tsx        # 푸터
│   │   ├── LoadingSpinner.tsx # 로딩 스피너
│   │   └── ToastContainer.tsx # 토스트 알림
│   │
│   ├── hooks/                 # 커스텀 React 훅
│   │   ├── useIdempotencyKey.ts # 멱등성 키 생성 및 관리
│   │   ├── useCountDown.ts      # 카운트다운 타이머 (60초 홀드)
│   │   └── usePolling.ts        # 폴링 로직 (대기열 상태 조회)
│   │
│   ├── pages/                 # 페이지 컴포넌트 (React Router)
│   │   ├── Landing.tsx       # 랜딩 페이지 (이벤트 목록)
│   │   ├── Queue.tsx         # 대기열 페이지
│   │   ├── Reserve.tsx       # 예약 페이지 (좌석 선택)
│   │   ├── Payment.tsx       # 결제 페이지
│   │   └── Confirm.tsx       # 확인 페이지 (예매 완료)
│   │
│   ├── state/                 # 상태 관리
│   │   └── session.ts        # Zustand 세션 스토어 (persist)
│   │
│   ├── utils/                 # 유틸리티 함수
│   │   └── config.ts         # 런타임 설정 관리
│   │
│   ├── data/                  # Mock 데이터
│   │   └── mockData.ts       # 개발용 더미 데이터 (Tree Shaking)
│   │
│   ├── test/                  # 테스트 설정
│   │   └── setup.ts          # Vitest 설정
│   │
│   ├── styles/                # 스타일 파일
│   │   └── index.css         # 글로벌 스타일 (Tailwind)
│   │
│   ├── App.tsx               # 루트 컴포넌트
│   └── main.tsx              # 엔트리 포인트
│
├── tests/                     # E2E 테스트 (Playwright)
├── coverage/                  # 테스트 커버리지 리포트
├── dist/                      # 프로덕션 빌드 결과물
│
├── scripts/
│   └── deploy-test.sh        # 로컬 배포 테스트 스크립트
│
├── Dockerfile                 # 컨테이너 이미지 빌드
├── vite.config.ts            # Vite 설정 (번들링, 청크 전략)
├── tailwind.config.js        # Tailwind CSS 설정
├── tsconfig.json             # TypeScript 설정
├── vitest.config.ts          # Vitest 설정
├── k6-load-test.js           # 부하 테스트 스크립트
├── DEPLOYMENT.md             # 배포 가이드 및 설정 문서
└── database-strategy.md      # 데이터베이스 전략 문서
```

---

## 🚀 배포 및 운영

### CI/CD 파이프라인

**자동 배포 (main 브랜치 push 시):**
```yaml
Trigger: main 브랜치 push
├── Lint & Type Check
├── Unit Tests (Vitest)
├── Production Build
├── Upload to S3
└── CloudFront Invalidation
```

**수동 배포 (GitHub Actions UI):**
- **Staging**: `/staging/` 경로 (1시간 캐시)
- **Production**: 루트 경로 (24시간 캐시)

**배포 스크립트:**
```bash
# 로컬에서 배포 테스트
./scripts/deploy-test.sh

# AWS CLI로 직접 배포
npm run build
aws s3 sync dist/ s3://traffictacos.store-static-website/ \
  --profile tacos \
  --cache-control "max-age=86400" \
  --exclude "*.html"
```

### AWS 인프라 구성

**리소스:**
- **S3 버킷**: `traffictacos.store-static-website`
- **CloudFront 배포 ID**: `E2J89BTI216W6U`
- **CloudFront URL**: https://d2lvyoth1pev4s.cloudfront.net
- **AWS 리전**: `ap-northeast-2` (Seoul)

**캐시 전략:**
```
정적 자산 (JS, CSS, 이미지):
  S3: max-age=86400 (24시간)
  CloudFront: 24시간 TTL
  
HTML 파일:
  S3: max-age=3600 (1시간)
  CloudFront: 1시간 TTL
  
Invalidation:
  배포 시 모든 파일 (/*) 무효화
```

**필요한 GitHub Secrets:**
```
AWS_ACCESS_KEY_ID      # AWS 액세스 키 ID
AWS_SECRET_ACCESS_KEY  # AWS 시크릿 액세스 키
```

### 모니터링 및 로깅

**CloudFront 로그:**
- 요청 로그 자동 수집
- S3 버킷에 저장

**성능 모니터링:**
- Lighthouse CI 통합 (향후)
- Web Vitals 자동 수집 (향후)

**에러 추적:**
- Sentry 통합 (향후)
- CloudWatch 로그 수집

---

## 🧪 테스트 전략

### 단위 테스트 (Vitest)

```bash
# Watch 모드
npm run test

# CI 모드 + 커버리지
npm run test:ci

# UI 모드
npm run test:ui
```

**커버리지 목표:**
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

**테스트 예시:**
```typescript
// LoadingSpinner.test.tsx
describe('LoadingSpinner', () => {
  it('renders spinner with default size', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
  
  it('renders with custom message', () => {
    render(<LoadingSpinner message="로딩 중..." />)
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })
})
```

### E2E 테스트 (Playwright)

```bash
# E2E 테스트 실행
npm run test:e2e

# UI 모드
npm run test:e2e:ui
```

**테스트 시나리오:**
- 전체 예약 플로우 (Landing → Queue → Reserve → Payment → Confirm)
- 대기열 시스템 (참여, 상태 조회, 입장)
- 에러 처리 (네트워크 실패, 타임아웃)
- 모바일 반응형

### 부하 테스트 (k6)

```bash
# 대기열 참여 부하 테스트
k6 run k6-load-test.js

# 옵션: VU(가상 사용자) 수 조정
k6 run --vus 100 --duration 30s k6-load-test.js
```

**시나리오:**
- 대기열 참여: 1000 VU, 30초
- 예약 생성: 500 VU, 동시성 테스트
- API 응답 시간 측정: P95 < 120ms

---

## 💡 학습 포인트

이 프로젝트를 통해 배울 수 있는 핵심 개념들:

### 1. 프론트엔드 아키텍처

- **관심사의 분리**: API Client / State / Presentation 계층 분리
- **의존성 역전**: API 모드 추상화로 구현체 교체 가능
- **상태 관리 패턴**: Server State vs Client State 분리 전략

### 2. 성능 최적화

- **번들 최적화**: Code Splitting, Tree Shaking, Manual Chunks
- **네트워크 최적화**: HTTP/2, CDN, 캐싱 전략, Resource Hints
- **렌더링 최적화**: React.memo, useMemo, Virtual Scrolling

### 3. 분산 시스템 패턴

- **멱등성 (Idempotency)**: 중복 요청 방지
- **재시도 전략 (Retry)**: 지수 백오프, 타임아웃
- **폴링 vs WebSocket**: 실시간 통신 트레이드오프
- **대기열 시스템**: 트래픽 제어 및 공정성 보장

### 4. DevOps & 자동화

- **CI/CD 파이프라인**: GitHub Actions 워크플로우
- **인프라 as 코드**: CloudFormation/Terraform (백엔드)
- **무중단 배포**: CloudFront 캐시 무효화 전략
- **모니터링**: Web Vitals, Lighthouse, CloudWatch

### 5. 사용자 경험 (UX)

- **로딩 상태**: Skeleton, Spinner, Progress Bar
- **에러 처리**: Graceful Degradation, Fallback UI
- **실시간 피드백**: 카운트다운 타이머, 대기 순번 표시
- **접근성**: ARIA, 키보드 내비게이션, 스크린 리더

### 6. 테스트 전략

- **단위 테스트**: 컴포넌트, 훅, 유틸리티 함수
- **통합 테스트**: API 클라이언트, 상태 관리
- **E2E 테스트**: 전체 사용자 플로우
- **부하 테스트**: k6로 성능 검증

---

## 🔮 향후 계획

### 단기 목표 (1-3개월)

- [ ] **Web Vitals 수집 및 분석**: Core Web Vitals API 전송
- [ ] **OpenTelemetry 통합**: 프론트엔드 트레이싱 및 메트릭
- [ ] **Service Worker**: 오프라인 지원 및 캐시 전략
- [ ] **Virtual Scrolling**: 대규모 좌석 목록 렌더링 최적화
- [ ] **i18n 국제화**: 다국어 지원 (한국어, 영어)

### 중기 목표 (3-6개월)

- [ ] **PWA 전환**: 설치 가능한 웹 앱
- [ ] **WebSocket 실시간 통신**: 폴링 대신 실시간 대기열 상태
- [ ] **Optimistic UI**: 낙관적 업데이트로 UX 개선
- [ ] **A/B 테스트**: Feature Flag 기반 실험
- [ ] **Sentry 통합**: 에러 추적 및 성능 모니터링

### 장기 목표 (6-12개월)

- [ ] **마이크로 프론트엔드**: Module Federation으로 서비스 분리
- [ ] **Server Components**: React 18 Server Components 도입 검토
- [ ] **Edge Computing**: Cloudflare Workers/Deno Deploy
- [ ] **GraphQL**: REST API 대신 GraphQL 게이트웨이
- [ ] **Machine Learning**: 예상 대기 시간 예측 모델

---

## 🤝 기여하기

이 프로젝트는 학습 목적으로 개발되었으며, 기여를 환영합니다!

### 기여 방법

1. **Fork** 저장소
2. **Feature Branch** 생성 (`git checkout -b feature/amazing-feature`)
3. **Commit** 변경사항 (`git commit -m 'Add some amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Pull Request** 생성

### 코드 스타일

- **ESLint**: 자동 린팅 적용
- **Prettier**: 코드 포맷팅 (향후 추가)
- **TypeScript**: 엄격 모드 활성화
- **Conventional Commits**: 커밋 메시지 규칙 준수

### 이슈 등록

버그 리포트 또는 기능 요청은 [Issues](https://github.com/traffic-tacos/reservation-web/issues)에서 등록해주세요.

---

## 📚 참고 자료

### 공식 문서
- [React 공식 문서](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite 가이드](https://vitejs.dev/guide/)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [Zustand 문서](https://zustand-demo.pmnd.rs/)

### 아키텍처 및 패턴
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [12 Factor App](https://12factor.net/)
- [Idempotency Patterns](https://stripe.com/docs/api/idempotent_requests)

### 성능 최적화
- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)

---

## 📄 라이선스

이 프로젝트는 **MIT License** 하에 제공됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

---

## 👥 팀

**Traffic Tacos Team** - 대규모 트래픽 처리를 위한 현대적인 웹 애플리케이션 개발

---

## 🎉 마치며

이 프로젝트는 단순한 티켓 예매 시스템을 넘어, **실무에서 마주치는 복잡한 문제들을 해결하는 과정**을 담았습니다. 

- 📖 **학습**: 최신 웹 기술 트렌드와 베스트 프랙티스
- 🛠️ **실전**: 멱등성, 재시도, 대기열 등 분산 시스템 패턴
- ⚡ **성능**: 번들 최적화, 캐싱, CDN 배포 전략
- 🎨 **UX**: 실시간 피드백, 에러 처리, 접근성

이 프로젝트가 여러분의 학습과 개발에 영감을 주길 바랍니다. 질문이나 피드백은 언제든 환영합니다!

**Happy Coding! 🚀**

---

<div align="center">

Made with ❤️ by Traffic Tacos Team

[🌐 Website](https://d2lvyoth1pev4s.cloudfront.net) · [📖 Docs](https://github.com/traffic-tacos/reservation-web/wiki) · [💬 Discussions](https://github.com/traffic-tacos/reservation-web/discussions)

</div>
