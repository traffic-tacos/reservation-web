# 🚀 CI/CD 파이프라인

Traffic Tacos 웹 애플리케이션을 위한 완전 자동화된 CI/CD 파이프라인입니다.

## 📋 워크플로우 개요

### 1. CI 파이프라인 (`ci.yml`)
- **트리거**: `main`/`develop` 브랜치 푸시 또는 PR
- **실행 작업**:
  - 코드 품질 검사 (Lint, TypeScript)
  - 단위 테스트 및 커버리지
  - 프로덕션 빌드
  - 보안 취약점 스캔
  - S3 배포 준비 (주석처리됨)

### 2. 수동 배포 (`deploy-manual.yml`)
- **트리거**: 수동 실행 (workflow_dispatch)
- **환경 옵션**: staging, production
- **특징**: 환경별 배포 및 버전 관리

### 3. 릴리즈 배포 (`release.yml`)
- **트리거**: 버전 태그 푸시 (`v*.*.*`)
- **실행 작업**:
  - GitHub Release 생성
  - 프로덕션 배포 준비
  - 변경 로그 자동 생성

### 4. 보안 스캔 (`security-scan.yml`)
- **트리거**: 매주 월요일 또는 수동 실행
- **스캔 항목**:
  - NPM 의존성 취약점
  - CodeQL 코드 보안 분석
  - 파일 시스템 취약점

## 🔧 로컬 개발 명령어

```bash
# CI와 동일한 검증 실행
npm run ci:check

# 개별 검증 실행
npm run type-check    # TypeScript 타입 검사
npm run lint:ci      # ESLint 검사
npm run test:ci      # 테스트 및 커버리지
npm run build:ci     # 프로덕션 빌드
```

## 🚀 배포 활성화하기

### 1. AWS 리소스 준비

```bash
# S3 버킷 생성
aws s3 mb s3://traffic-tacos-web-prod

# CloudFront 배포판 생성
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json

# IAM 사용자 및 정책 생성
aws iam create-user --user-name github-actions-deploy
aws iam attach-user-policy --user-name github-actions-deploy --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### 2. GitHub Secrets 설정

GitHub Repository Settings > Secrets and variables > Actions에서 다음 시크릿 추가:

```bash
# AWS 자격 증명
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-northeast-2

# S3 버킷 정보
S3_BUCKET_PRODUCTION=traffic-tacos-web-prod
S3_BUCKET_STAGING=traffic-tacos-web-staging

# CloudFront 배포판 ID
CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id

# GitHub 토큰 (자동 생성됨)
GITHUB_TOKEN=github-token
```

### 3. 배포 코드 활성화

워크플로우 파일에서 주석처리된 배포 코드를 활성화:

```yaml
# 🚨 실제 S3 배포는 아래 주석을 해제하세요
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ secrets.AWS_REGION }}

- name: Deploy to S3
  run: |
    aws s3 sync dist/ s3://${{ secrets.S3_BUCKET_NAME }} --delete
```

## 📊 모니터링 및 알림

### 상태 배지

```markdown
![CI](https://github.com/your-repo/traffic-tacos-web/workflows/CI/CD%20Pipeline/badge.svg)
![Security](https://github.com/your-repo/traffic-tacos-web/workflows/Security%20Scan/badge.svg)
```

### 알림 설정

GitHub Repository Settings > Notifications에서 다음 이벤트에 대한 알림 설정:
- 워크플로우 실패
- 보안 경고
- 새로운 릴리즈

## 🔒 보안 고려사항

### 시크릿 관리
- AWS 자격 증명은 GitHub Secrets에 저장
- OIDC를 통한 AWS 인증 권장
- 시크릿은 최소 권한 원칙 적용

### 네트워크 보안
- CloudFront를 통한 CDN 배포
- HTTPS 전용 연결
- CSP 헤더 설정

### 코드 보안
- CodeQL을 통한 정적 분석
- 의존성 취약점 스캔
- 자동화된 보안 업데이트

## 📈 성능 최적화

### 빌드 최적화
- 코드 스플리팅 적용
- 이미지 최적화
- 캐시 전략 구현

### 모니터링
- CloudWatch를 통한 성능 모니터링
- 사용자 경험 메트릭 수집
- 에러 트래킹

## 🐛 문제 해결

### 일반적인 문제

**빌드 실패**
```bash
# 로컬에서 동일한 환경으로 테스트
npm run ci:check
```

**배포 실패**
```bash
# AWS 권한 확인
aws sts get-caller-identity

# S3 버킷 권한 확인
aws s3 ls s3://your-bucket-name
```

**테스트 실패**
```bash
# 커버리지 보고서 확인
npm run test:ci -- --coverage.reporter=html
open coverage/index.html
```

## 📝 추가 설정

### 브랜치 보호 규칙

Repository Settings > Branches에서 다음 규칙 설정:
- `main` 브랜치 보호
- CI 통과 요구
- 코드 리뷰 요구
- 상태 체크 요구

### 자동화된 작업

- Dependabot을 통한 의존성 자동 업데이트
- 자동화된 보안 스캔
- 정기적인 백업 및 모니터링

---

이 CI/CD 파이프라인은 현재 **코드 품질 검사 및 테스트까지만 활성화**되어 있습니다.
실제 배포를 위해서는 위의 "배포 활성화하기" 섹션을 따라 AWS 리소스를 설정하고 GitHub Secrets을 구성하세요.
