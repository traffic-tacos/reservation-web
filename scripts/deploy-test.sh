#!/bin/bash

# 테스트 배포 스크립트
# 실제 배포 전에 로컬에서 빌드와 AWS 연결을 테스트합니다

set -e

echo "🔧 Starting deployment test..."

# 색깔 있는 출력을 위한 함수들
print_success() {
    echo -e "\033[32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[31m❌ $1\033[0m"
}

print_info() {
    echo -e "\033[34mℹ️  $1\033[0m"
}

print_warning() {
    echo -e "\033[33m⚠️  $1\033[0m"
}

# AWS CLI 설치 확인
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

# AWS 프로필 확인
if ! aws sts get-caller-identity --profile tacos &> /dev/null; then
    print_error "AWS profile 'tacos' not found or not configured."
    print_info "Please configure AWS CLI with 'aws configure --profile tacos'"
    exit 1
fi

print_success "AWS CLI and profile 'tacos' are configured"

# Node.js 및 npm 확인
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install Node.js and npm first."
    exit 1
fi

print_success "Node.js and npm are available"

# Dependencies 설치
print_info "Installing dependencies..."
npm ci

# 린트 실행
print_info "Running linting..."
if npm run lint:ci; then
    print_success "Linting passed"
else
    print_warning "Linting had issues but continuing..."
fi

# 타입 체크 실행
print_info "Running type check..."
if npm run type-check; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    exit 1
fi

# 테스트 실행
print_info "Running tests..."
if npm run test:ci; then
    print_success "Tests passed"
else
    print_error "Tests failed"
    exit 1
fi

# 빌드 실행
print_info "Building for production..."
if NODE_ENV=production VITE_BUILD_ENV=production npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# 빌드 결과 확인
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist/ | cut -f1)
    FILE_COUNT=$(find dist/ -type f | wc -l)
    print_success "Build output: ${DIST_SIZE} (${FILE_COUNT} files)"

    # 주요 파일들 확인
    if [ -f "dist/index.html" ]; then
        print_success "index.html found"
    else
        print_error "index.html not found in dist/"
        exit 1
    fi
else
    print_error "dist/ directory not found after build"
    exit 1
fi

# AWS S3 연결 테스트
print_info "Testing AWS S3 connection..."
if aws s3 ls s3://traffictacos.store-static-website --profile tacos &> /dev/null; then
    print_success "S3 bucket access confirmed"
else
    print_error "Cannot access S3 bucket 'traffictacos.store-static-website'"
    exit 1
fi

# CloudFront 연결 테스트
print_info "Testing CloudFront access..."
if aws cloudfront get-distribution --id E2J89BTI216W6U --profile tacos &> /dev/null; then
    print_success "CloudFront distribution access confirmed"
else
    print_error "Cannot access CloudFront distribution 'E2J89BTI216W6U'"
    exit 1
fi

# 테스트 배포 (선택사항)
echo ""
read -p "🤔 Do you want to deploy to S3 test folder? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deploying to S3 test folder..."

    aws s3 sync dist/ s3://traffictacos.store-static-website/test-$(date +%s)/ \
        --profile tacos \
        --cache-control "max-age=3600" \
        --delete

    print_success "Test deployment completed!"
    print_info "You can check: https://d2lvyoth1pev4s.cloudfront.net/test-$(date +%s)/"
else
    print_info "Skipping test deployment"
fi

echo ""
print_success "🎉 All tests passed! Ready for CI/CD deployment."
echo ""
print_info "Next steps:"
echo "  1. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to GitHub Secrets"
echo "  2. Push to main branch or run Manual Deploy workflow"
echo "  3. Check deployment at: https://d2lvyoth1pev4s.cloudfront.net"