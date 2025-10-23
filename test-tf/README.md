# Traffic Tacos Test Infrastructure

이 디렉토리에는 테스트용 정적 웹사이트 인프라를 위한 Terraform 코드가 포함되어 있습니다.

## 🚀 아키텍처

- **S3 버킷**: `traffictacos.store-static-website` - 정적 파일 호스팅
- **CloudFront**: CDN 및 HTTPS 지원
- **Route53**: DNS 레코드 관리 (www.traffictacos.store)
- **ACM**: SSL 인증서 자동 생성 및 관리

## 📋 전제 조건

- AWS CLI 설치 및 설정
- Terraform >= 1.6.6
- `tacos` AWS 프로필 또는 GitHub Secrets 설정

## 🔧 수동 실행 (로컬)

```bash
# 1. AWS 프로필 설정
aws configure --profile tacos

# 2. Terraform 초기화
terraform init

# 3. 계획 확인
terraform plan

# 4. 인프라 생성
terraform apply

# 5. 결과 확인
terraform output
```

## 🤖 자동화 (GitHub Actions)

### 설정 방법

1. **GitHub Secrets 설정** (Repository Settings > Secrets and variables > Actions):
   ```
   AWS_ACCESS_KEY_ID = YOUR_AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY = YOUR_AWS_SECRET_ACCESS_KEY
   ```

2. **`test` 브랜치에 `test-tf/` 폴더 내용 변경사항 푸시**

### 워크플로우 동작

- **PR 시**: Terraform plan 결과 표시
- **Push 시**: 자동으로 `terraform apply` 실행
- **실패 시**: Slack/Teams 알림 (선택사항)

## 📤 웹사이트 배포

Terraform apply 후, 빌드된 파일들을 S3에 업로드:

```bash
# 프로젝트 루트에서 실행
cd ..
npm run build
aws s3 cp dist/ s3://traffictacos.store-static-website/ --recursive --profile tacos
```

## 🌐 접속 URL

- **Root Domain**: https://traffictacos.store
- **WWW Domain**: https://www.traffictacos.store

## 🧹 정리

```bash
# 인프라 제거
terraform destroy

# 또는 특정 리소스만 제거
terraform destroy -target=aws_s3_bucket.static_website
```

## 📊 모니터링

CloudFront 및 S3 메트릭은 AWS Console에서 확인 가능:
- **CloudFront**: https://console.aws.amazon.com/cloudfront/
- **S3**: https://console.aws.amazon.com/s3/

## ⚠️ 주의사항

- ACM 인증서는 us-east-1 리전에서 생성됨 (CloudFront 요구사항)
- Route53 호스팅존 `traffictacos.store`가 이미 존재해야 함
- SSL 인증서 검증까지 30분 정도 소요될 수 있음