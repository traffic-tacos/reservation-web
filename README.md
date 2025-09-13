# Traffic Tacos - 티켓 예매 웹 애플리케이션

빠르고 안정적인 티켓 예매 서비스를 위한 React 기반 웹 애플리케이션입니다.
Vite + TypeScript + Tailwind CSS로 구축되었으며, 대규모 트래픽 상황에서의 안정적인 사용자 경험을 제공합니다.

## 🚀 특징

- **대기열 시스템**: 30k RPS 트래픽에서도 안정적인 대기열 처리
- **멱등성 보장**: 중복 요청 방지를 위한 Idempotency-Key 지원
- **폭주 대응**: 지수 백오프와 폴링을 통한 안정적인 API 통신
- **캐주얼 디자인**: 밝고 여유로운 UI로 사용자 친화적인 경험 제공
- **성능 최적화**: 코드 스플리팅과 lazy loading 적용
- **접근성**: WCAG 가이드라인 준수

## 🛠️ 기술 스택

### Frontend
- **React 18** - 사용자 인터페이스 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빠른 빌드 도구
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Framer Motion** - 애니메이션 및 마이크로 인터랙션

### 상태 관리 & 데이터
- **TanStack Query** - 서버 상태 관리 및 캐싱
- **Zustand** - 클라이언트 상태 관리
- **Ky** - HTTP 클라이언트 (fetch 기반)

### 개발 도구
- **Vitest** - 단위 테스트
- **Playwright** - E2E 테스트
- **ESLint** - 코드 품질 검사

## 📁 프로젝트 구조

```
src/
├── api/                 # API 클라이언트 및 서비스
│   ├── client.ts       # HTTP 클라이언트 설정
│   ├── queue.ts        # 대기열 API
│   ├── reservation.ts  # 예약 API
│   └── payment.ts      # 결제 API
├── components/         # 재사용 가능한 UI 컴포넌트
│   ├── Layout.tsx     # 레이아웃 컴포넌트
│   ├── Header.tsx     # 헤더
│   ├── Footer.tsx     # 푸터
│   └── LoadingSpinner.tsx
├── hooks/             # 커스텀 React 훅
│   ├── useIdempotencyKey.ts
│   ├── useCountDown.ts
│   └── usePolling.ts
├── pages/             # 페이지 컴포넌트
│   ├── Landing.tsx    # 랜딩 페이지
│   ├── Queue.tsx      # 대기열 페이지
│   ├── Reserve.tsx    # 예약 페이지
│   ├── Payment.tsx    # 결제 페이지
│   └── Confirm.tsx    # 확인 페이지
├── state/             # 상태 관리
│   └── session.ts     # 세션 상태 (Zustand)
├── styles/            # 스타일 파일
│   └── index.css      # 글로벌 스타일
├── utils/             # 유틸리티 함수
│   └── config.ts      # 설정 관리
├── observability/     # 관측성 관련
└── i18n/             # 국제화
public/
├── config.json       # 런타임 설정
└── index.html        # HTML 템플릿
```

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 미리보기
npm run preview
```

### 환경 설정

`/public/config.json` 파일을 통해 런타임 설정을 관리합니다:

```json
{
  "API_BASE": "https://api.traffic-tacos.com",
  "ENV": "development",
  "FEATURES": {
    "REQUIRE_LOGIN_TO_RESERVE": false,
    "ENABLE_ANALYTICS": true,
    "ENABLE_ERROR_REPORTING": true
  },
  "QUEUE_POLLING_INTERVAL": 2000,
  "RESERVATION_HOLD_TIME": 60,
  "PAYMENT_TIMEOUT": 300
}
```

## 🎯 사용자 플로우

### 1. 이벤트 선택 (Landing)
- 이벤트 목록 표시
- 대기열 참여 버튼

### 2. 대기열 대기 (Queue)
- 실시간 대기열 상태 표시
- 예상 대기 시간 및 순번 표시
- 입장 준비 완료 시 자동 알림

### 3. 좌석 예약 (Reserve)
- 좌석 및 수량 선택
- 60초 홀드 타이머
- 실시간 재고 확인

### 4. 결제 처리 (Payment)
- 결제 시뮬레이션 모드 선택
- 승인/실패/지연 시나리오 지원

### 5. 예매 완료 (Confirm)
- 예매 정보 요약
- 공유 및 재예매 옵션

## 🧪 테스트

### 단위 테스트

```bash
npm run test
```

### E2E 테스트

```bash
npm run test:e2e
```

### 테스트 커버리지

```bash
npm run test:coverage
```

## 📊 성능 및 모니터링

### Web Vitals 수집

자동으로 Core Web Vitals 메트릭을 수집하여 API로 전송합니다.

### 에러 바운더리

예상치 못한 JavaScript 에러를 gracefully하게 처리합니다.

### 캐시 전략

- TanStack Query를 통한 서버 상태 캐싱
- Service Worker를 통한 정적 자원 캐싱 (향후 구현)

## 🎨 디자인 가이드

### 색상 팔레트

- **Primary**: 파스텔 블루 계열 (#0ea5e9)
- **Secondary**: 민트 계열 (#22c55e)
- **Accent**: 라벤더 계열 (#a855f7)
- **Background**: 그라데이션 (primary-50 to secondary-50)

### 타이포그래피

- **폰트**: Inter/Pretendard
- **제목**: 2xl ~ 4xl, font-bold
- **본문**: base, font-normal
- **색상**: text-gray-900 (제목), text-gray-600 (본문)

### 컴포넌트 스타일

- **버튼**: 둥근 모서리 (rounded-2xl), 부드러운 그림자
- **카드**: 흰색 배경, 부드러운 테두리와 그림자
- **인풋**: 파스텔 테두리, 포커스 시 primary 색상

### 애니메이션

- **마이크로 인터랙션**: hover/tap 시 scale 애니메이션
- **페이지 전환**: fade-in 효과
- **로딩**: 부드러운 스피너 애니메이션

## 🔧 API 통합

### 지원되는 엔드포인트

- `POST /api/v1/queue/join` - 대기열 참여
- `GET /api/v1/queue/status` - 대기열 상태 조회
- `POST /api/v1/queue/enter` - 입장 허가 요청
- `POST /api/v1/reservations` - 예약 생성
- `POST /api/v1/reservations/{id}/confirm` - 예약 확정
- `POST /api/v1/reservations/{id}/cancel` - 예약 취소
- `POST /api/v1/payment/intent` - 결제 인텐트 생성

### 에러 처리

표준화된 에러 응답 포맷을 지원합니다:

```typescript
{
  error: {
    code: "ERROR_CODE",
    message: "human readable message",
    trace_id: "..."
  }
}
```

## 🚀 배포

### CloudFront + S3

```bash
# 프로덕션 빌드
npm run build

# 빌드된 파일들을 S3에 업로드
aws s3 sync dist/ s3://your-bucket-name --delete

# CloudFront 캐시 무효화 (필요시)
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### 환경별 설정

환경에 따라 `config.json`을 다르게 배포하여 API 엔드포인트 등을 변경할 수 있습니다.

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 제공됩니다.

---

**Traffic Tacos 팀**

