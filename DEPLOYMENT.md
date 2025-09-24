# 🚀 CI/CD 배포 설정 가이드

## 📋 필요한 GitHub Secrets

다음 Secrets를 GitHub 레포지토리 설정에 추가해야 합니다:

### AWS 관련 Secrets
```
AWS_ACCESS_KEY_ID      # AWS 액세스 키 ID
AWS_SECRET_ACCESS_KEY  # AWS 시크릿 액세스 키
```

**AWS 자격 증명 생성 방법:**
1. AWS IAM 콘솔에서 새 사용자 생성 또는 기존 사용자 사용
2. 필요한 정책 연결:
   - `AmazonS3FullAccess` (S3 버킷 관리용)
   - `CloudFrontFullAccess` (CloudFront invalidation용)
3. 프로그래매틱 액세스를 위한 액세스 키 생성
4. GitHub Secrets에 키 추가

## 🏗️ AWS 리소스 정보

현재 설정된 리소스:
- **S3 버킷**: `traffictacos.store-static-website`
- **CloudFront 배포 ID**: `E2J89BTI216W6U`
- **CloudFront URL**: https://d2lvyoth1pev4s.cloudfront.net
- **AWS 리전**: `ap-northeast-2` (Seoul)

## 🔄 배포 워크플로우

### 1. 자동 배포 (main 브랜치 push 시)
- 파일: `.github/workflows/deploy-s3-cdn.yml`
- 트리거: main 브랜치에 push
- 과정:
  1. 린트, 타입 체크, 테스트 실행
  2. 프로덕션 빌드 생성
  3. S3에 파일 업로드
  4. CloudFront 캐시 무효화

### 2. 수동 배포
- 파일: `.github/workflows/deploy-manual.yml`
- 트리거: GitHub Actions UI에서 수동 실행
- 환경 선택: staging 또는 production
- staging: `/staging/` 폴더에 배포 (1시간 캐시)
- production: 루트에 배포 (24시간 캐시)

## 📦 캐시 전략

### S3 파일별 캐시 설정
- **정적 자산** (JS, CSS, 이미지): `max-age=86400` (24시간)
- **HTML 파일**: `max-age=3600` (1시간)
- **Service Worker, Manifest**: `max-age=3600` (1시간)

### CloudFront 설정
- 모든 파일에 대해 invalidation 생성
- 배포 완료 후 자동으로 캐시 무효화

## 🚀 배포 실행 방법

### GitHub Actions에서 수동 배포
1. GitHub 레포지토리 → Actions 탭
2. "Manual Deploy" 워크플로우 선택
3. "Run workflow" 클릭
4. 환경 선택 (staging/production)
5. 실행

### 로컬에서 테스트 배포 (선택사항)
```bash
# 빌드 테스트
npm run build

# AWS CLI로 직접 배포 (테스트용)
aws s3 sync dist/ s3://traffictacos.store-static-website/test/ --profile tacos
```

## ⚠️ 주의사항

1. **Secrets 보안**: AWS 자격 증명은 최소 권한 원칙 적용
2. **CloudFront 캐시**: invalidation은 비용이 발생할 수 있음 (월 1000개까지 무료)
3. **S3 권한**: 웹사이트 호스팅을 위한 퍼블릭 읽기 권한 필요
4. **DNS**: 도메인 연결 시 CloudFront 배포 설정 추가 필요

## 🔍 배포 상태 확인

배포 완료 후 다음 URL에서 확인:
- **CloudFront**: https://d2lvyoth1pev4s.cloudfront.net
- **S3 직접 접근**: http://traffictacos.store-static-website.s3-website.ap-northeast-2.amazonaws.com

## 📊 모니터링

GitHub Actions 실행 로그에서 다음 정보 확인 가능:
- 빌드 시간 및 번들 크기
- S3 업로드 상태
- CloudFront invalidation 상태
- 배포 완료 시간

---

**설정 완료 후 main 브랜치에 push하면 자동으로 배포가 시작됩니다!** 🎉